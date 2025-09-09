const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            if (this.pool) {
                await this.pool.end();
            }

            this.pool = mysql.createPool(dbConfig.getConfig());
            
            // Verificar conexión
            const connection = await this.pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();
            
            this.isConnected = true;
            console.log('✅ Conexión a base de datos establecida');
            
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
            console.log('🔄 Reconectando a la base de datos...');
            await this.initialize();
        }
    }

    async execute(query, params = []) {
        try {
            await this.ensureConnection();
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('❌ Error ejecutando consulta:', {
                query: query.substring(0, 100) + '...',
                error: error.message
            });
            throw error;
        }
    }

    async healthCheck() {
        try {
            await this.ensureConnection();
            const result = await this.execute('SELECT 1 as healthy');
            return result[0].healthy === 1;
        } catch (error) {
            console.error('❌ Health check falló:', error.message);
            return false;
        }
    }

    async getConnectionInfo() {
        try {
            await this.ensureConnection();
            const result = await this.execute(`
                SELECT 
                    DATABASE() as current_database,
                    USER() as db_user,
                    VERSION() as mysql_version,
                    NOW() as server_time
            `);
            return result[0];
        } catch (error) {
            console.error('❌ Error obteniendo información de conexión:', error.message);
            return null;
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

    // ==================== MÉTODOS PARA ENTIDADES ====================

    async getAllEntidades() {
        const query = `
            SELECT id, nombre, estado, created_at, updated_at 
            FROM entidades 
            WHERE estado = true 
            ORDER BY nombre ASC
        `;
        return await this.execute(query);
    }

    async getEntidadById(id) {
        const query = 'SELECT * FROM entidades WHERE id = ? AND estado = true';
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async getEntidadByNombre(nombre) {
        const query = 'SELECT * FROM entidades WHERE nombre LIKE ? AND estado = true LIMIT 1';
        const result = await this.execute(query, [`%${nombre}%`]);
        return result.length > 0 ? result[0] : null;
    }

    // ==================== MÉTODOS PARA QUEJAS ====================

    async getAllQuejas(limit = 100, offset = 0) {
        // Asegurar que los parámetros sean enteros
        const limitInt = parseInt(limit);
        const offsetInt = parseInt(offset);
        
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.created_at,
                q.updated_at
            FROM quejas q 
            INNER JOIN entidades e ON q.entidad_id = e.id 
            ORDER BY q.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await this.execute(query, [limitInt, offsetInt]);
    }

    async getQuejaById(id) {
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.created_at,
                q.updated_at
            FROM quejas q 
            INNER JOIN entidades e ON q.entidad_id = e.id 
            WHERE q.id = ?
        `;
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async createQueja(quejaData) {
        const query = `
            INSERT INTO quejas (entidad_id, descripcion) 
            VALUES (?, ?)
        `;
        const result = await this.execute(query, [
            quejaData.entidad_id,
            quejaData.descripcion
        ]);
        
        // Obtener la queja recién creada
        const newQueja = await this.getQuejaById(result.insertId);
        return {
            insertId: result.insertId,
            ...newQueja
        };
    }

    async getQuejasByEntidad(entidadId, limit = 50, offset = 0) {
        try {
            // Convertir parámetros a enteros de forma explícita
            const entidadIdInt = parseInt(entidadId, 10);
            
            // Validar que el ID sea un número válido
            if (isNaN(entidadIdInt)) {
                throw new Error('ID de entidad inválido');
            }
            
            // Primero intentamos una consulta simple sin paginación
            const simpleQuery = `
                SELECT 
                    q.id,
                    q.entidad_id,
                    e.nombre as entidad_nombre,
                    q.descripcion,
                    q.created_at,
                    q.updated_at
                FROM quejas q 
                INNER JOIN entidades e ON q.entidad_id = e.id 
                WHERE q.entidad_id = ?
                ORDER BY q.created_at DESC
            `;
            
            const allResults = await this.execute(simpleQuery, [entidadIdInt]);
            
            // Aplicar paginación manualmente
            const limitInt = parseInt(limit, 10) || 50;
            const offsetInt = parseInt(offset, 10) || 0;
            
            return allResults.slice(offsetInt, offsetInt + limitInt);
        } catch (error) {
            console.error('❌ Error en getQuejasByEntidad:', error.message);
            throw error;
        }
    }

    async deleteQueja(id) {
        const query = 'DELETE FROM quejas WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.affectedRows > 0;
    }

    // ==================== MÉTODOS PARA ESTADÍSTICAS ====================

    async getEstadisticasGenerales() {
        const queries = {
            totalQuejas: 'SELECT COUNT(*) as total FROM quejas',
            totalEntidades: 'SELECT COUNT(*) as total FROM entidades WHERE estado = true',
            quejasHoy: `
                SELECT COUNT(*) as total 
                FROM quejas 
                WHERE DATE(created_at) = CURDATE()
            `,
            quejasMes: `
                SELECT COUNT(*) as total 
                FROM quejas 
                WHERE MONTH(created_at) = MONTH(CURDATE()) 
                AND YEAR(created_at) = YEAR(CURDATE())
            `
        };

        const results = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const result = await this.execute(query);
            results[key] = result[0].total;
        }

        return results;
    }

    async getQuejasPorEntidad() {
        const query = `
            SELECT 
                e.id,
                e.nombre as entidad, 
                COUNT(q.id) as count 
            FROM entidades e 
            LEFT JOIN quejas q ON e.id = q.entidad_id 
            WHERE e.estado = true
            GROUP BY e.id, e.nombre 
            ORDER BY count DESC
        `;
        return await this.execute(query);
    }

    async getQuejasPorMes(limite = 12) {
        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as mes,
                COUNT(*) as count 
            FROM quejas 
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY mes DESC
            LIMIT ?
        `;
        return await this.execute(query, [limite]);
    }

    // ==================== MÉTODO PARA CONTAR QUEJAS ====================

    async getQuejasCount() {
        const query = 'SELECT COUNT(*) as count FROM quejas';
        const result = await this.execute(query);
        return result[0].count;
    }

    async getQuejasByEntidadCount(entidadId) {
        const entidadIdInt = parseInt(entidadId);
        const query = 'SELECT COUNT(*) as count FROM quejas WHERE entidad_id = ?';
        const result = await this.execute(query, [entidadIdInt]);
        return result[0].count;
    }
}

module.exports = new DatabaseService();
