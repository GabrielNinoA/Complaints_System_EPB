const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

/**
 * Repository - Clase única para manejar todas las queries de la base de datos
 * Todas las operaciones de base de datos están centralizadas aquí
 */
class Repository {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    // ==================== GESTIÓN DE CONEXIÓN ====================

    async initialize() {
        try {
            if (this.pool) {
                await this.pool.end();
            }

            this.pool = mysql.createPool(dbConfig.getConfig());
            
            const connection = await this.pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();
            
            this.isConnected = true;
            
            return true;
        } catch (error) {
            this.isConnected = false;
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw error;
        }
    }

    async ensureConnection() {
        if (!this.isConnected || !this.pool) {
            await this.initialize();
        }
        
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
        } catch (error) {
            await this.initialize();
        }
    }

    async execute(query, params = []) {
        try {
            await this.ensureConnection();
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('❌ [REPOSITORY] Error ejecutando consulta:', {
                query: query.substring(0, 100) + '...',
                error: error.message,
                code: error.code
            });
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            console.log('🔌 Conexión a base de datos cerrada');
        }
    }

    // ==================== QUERIES PARA HEALTH CHECK ====================

    async healthCheck() {
        const result = await this.execute('SELECT 1 as healthy');
        return result[0].healthy === 1;
    }

    async getConnectionInfo() {
        const result = await this.execute(`
            SELECT 
                DATABASE() as current_database,
                USER() as db_user,
                VERSION() as mysql_version,
                NOW() as server_time
        `);
        return result[0];
    }

    // ==================== QUERIES PARA ENTIDADES ====================

    async findAllEntidades() {
        const query = `
            SELECT id, nombre, estado, created_at, updated_at 
            FROM entidades 
            WHERE estado = true 
            ORDER BY nombre ASC
        `;
        return await this.execute(query);
    }

    async findEntidadById(id) {
        const query = 'SELECT * FROM entidades WHERE id = ? AND estado = true';
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async findEntidadByNombre(nombre) {
        const query = 'SELECT * FROM entidades WHERE nombre LIKE ? AND estado = true LIMIT 1';
        const result = await this.execute(query, [`%${nombre}%`]);
        return result.length > 0 ? result[0] : null;
    }

    // ==================== QUERIES PARA QUEJAS ====================

    async findAllQuejas(limit, offset) {
        // Asegurar que limit y offset son enteros
        const limitInt = parseInt(limit, 10);
        const offsetInt = parseInt(offset, 10);
        
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.state,
                q.created_at,
                q.updated_at,
                COUNT(c.id) as total_comentarios
            FROM quejas q 
            INNER JOIN entidades e ON q.entidad_id = e.id 
            LEFT JOIN comentarios c ON q.id = c.queja_id
            GROUP BY q.id, q.entidad_id, e.nombre, q.descripcion, q.state, q.created_at, q.updated_at
            ORDER BY q.created_at DESC 
            LIMIT ${limitInt} OFFSET ${offsetInt}
        `;
        return await this.execute(query);
    }

    async findQuejaById(id) {
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.state,
                q.created_at,
                q.updated_at,
                COUNT(c.id) as total_comentarios
            FROM quejas q 
            INNER JOIN entidades e ON q.entidad_id = e.id 
            LEFT JOIN comentarios c ON q.id = c.queja_id
            WHERE q.id = ?
            GROUP BY q.id, q.entidad_id, e.nombre, q.descripcion, q.state, q.created_at, q.updated_at
        `;
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async insertQueja(entidadId, descripcion) {
        const query = `
            INSERT INTO quejas (entidad_id, descripcion) 
            VALUES (?, ?)
        `;
        const result = await this.execute(query, [entidadId, descripcion]);
        return result.insertId;
    }

    async findQuejasByEntidad(entidadId, limit, offset) {
        // Asegurar que limit y offset son enteros
        const limitInt = parseInt(limit, 10);
        const offsetInt = parseInt(offset, 10);
        
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.state,
                q.created_at,
                q.updated_at,
                COUNT(c.id) as total_comentarios
            FROM quejas q 
            INNER JOIN entidades e ON q.entidad_id = e.id 
            LEFT JOIN comentarios c ON q.id = c.queja_id
            WHERE q.entidad_id = ?
            GROUP BY q.id, q.entidad_id, e.nombre, q.descripcion, q.state, q.created_at, q.updated_at
            ORDER BY q.created_at DESC
            LIMIT ${limitInt} OFFSET ${offsetInt}
        `;
        return await this.execute(query, [entidadId]);
    }

    async deleteQuejaById(id) {
        const query = 'DELETE FROM quejas WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.affectedRows > 0;
    }

    async updateQuejaState(id, state) {
        const query = `
            UPDATE quejas 
            SET state = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        const result = await this.execute(query, [state, id]);
        return result.affectedRows > 0;
    }

    async countQuejas() {
        const query = 'SELECT COUNT(*) as count FROM quejas';
        const result = await this.execute(query);
        return result[0].count;
    }

    async countQuejasByEntidad(entidadId) {
        const query = 'SELECT COUNT(*) as count FROM quejas WHERE entidad_id = ?';
        const result = await this.execute(query, [entidadId]);
        return result[0].count;
    }

    // ==================== QUERIES PARA COMENTARIOS ====================

    async findComentariosByQueja(quejaId) {
        const query = `
            SELECT 
                id,
                queja_id,
                texto,
                created_at as fecha,
                created_at,
                updated_at
            FROM comentarios 
            WHERE queja_id = ?
            ORDER BY created_at ASC
        `;
        return await this.execute(query, [quejaId]);
    }

    async findComentarioById(id) {
        const query = `
            SELECT 
                id,
                queja_id,
                texto,
                created_at as fecha,
                created_at,
                updated_at
            FROM comentarios 
            WHERE id = ?
        `;
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async insertComentario(quejaId, texto) {
        const query = `
            INSERT INTO comentarios (queja_id, texto) 
            VALUES (?, ?)
        `;
        const result = await this.execute(query, [quejaId, texto]);
        return result.insertId;
    }

    async updateComentario(id, texto) {
        const query = `
            UPDATE comentarios 
            SET texto = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        const result = await this.execute(query, [texto, id]);
        return result.affectedRows > 0;
    }

    async deleteComentarioById(id) {
        const query = 'DELETE FROM comentarios WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.affectedRows > 0;
    }

    async countComentariosByQueja(quejaId) {
        const query = 'SELECT COUNT(*) as count FROM comentarios WHERE queja_id = ?';
        const result = await this.execute(query, [quejaId]);
        return result[0].count;
    }

    // ==================== QUERIES PARA ESTADÍSTICAS ====================

    async countAllQuejas() {
        const query = 'SELECT COUNT(*) as total FROM quejas';
        const result = await this.execute(query);
        return result[0].total;
    }

    async countAllEntidades() {
        const query = 'SELECT COUNT(*) as total FROM entidades WHERE estado = true';
        const result = await this.execute(query);
        return result[0].total;
    }

    async countAllComentarios() {
        const query = 'SELECT COUNT(*) as total FROM comentarios';
        const result = await this.execute(query);
        return result[0].total;
    }

    async countQuejasToday() {
        const query = `
            SELECT COUNT(*) as total 
            FROM quejas 
            WHERE DATE(created_at) = CURDATE()
        `;
        const result = await this.execute(query);
        return result[0].total;
    }

    async countQuejasThisMonth() {
        const query = `
            SELECT COUNT(*) as total 
            FROM quejas 
            WHERE MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `;
        const result = await this.execute(query);
        return result[0].total;
    }

    async countComentariosToday() {
        const query = `
            SELECT COUNT(*) as total 
            FROM comentarios 
            WHERE DATE(created_at) = CURDATE()
        `;
        const result = await this.execute(query);
        return result[0].total;
    }

    async findQuejasPorEntidad() {
        const query = `
            SELECT 
                e.id,
                e.nombre as entidad, 
                COUNT(DISTINCT q.id) as count,
                COUNT(c.id) as comentarios_count
            FROM entidades e 
            LEFT JOIN quejas q ON e.id = q.entidad_id 
            LEFT JOIN comentarios c ON q.id = c.queja_id
            WHERE e.estado = true
            GROUP BY e.id, e.nombre 
            ORDER BY count DESC
        `;
        return await this.execute(query);
    }

    async findQuejasPorMes(limite) {
        // Asegurar que limite es entero
        const limiteInt = parseInt(limite, 10);
        
        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as mes,
                COUNT(*) as count 
            FROM quejas 
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY mes DESC
            LIMIT ${limiteInt}
        `;
        return await this.execute(query);
    }
}

module.exports = new Repository();
