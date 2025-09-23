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

            const config = {
                ...dbConfig.getConfig(),
                // Configuración específica para UTF-8
                charset: 'utf8mb4',
                collation: 'utf8mb4_unicode_ci',
                // Configuraciones adicionales para mejor manejo de conexiones
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            };

            this.pool = mysql.createPool(config);
            
            // Verificar conexión y configurar charset
            const connection = await this.pool.getConnection();
            
            // Forzar UTF-8 en la sesión actual
            await connection.execute('SET NAMES utf8mb4');
            await connection.execute('SET CHARACTER SET utf8mb4');
            await connection.execute('SET character_set_connection = utf8mb4');
            await connection.execute('SET character_set_client = utf8mb4');
            await connection.execute('SET character_set_results = utf8mb4');
            
            await connection.execute('SELECT 1');
            connection.release();
            
            this.isConnected = true;
            
            console.log('✅ Conexión a BD establecida con UTF-8 configurado');
            
            // Verificar configuración de caracteres
            await this.checkCharsetConfig();
            
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
            
            // Reforzar configuración UTF-8 en cada conexión
            await connection.execute('SET NAMES utf8mb4');
            
            connection.release();
        } catch (error) {
            console.log('🔄 Reestableciendo conexión...');
            await this.initialize();
        }
    }

    async execute(query, params = []) {
        try {
            await this.ensureConnection();
            
            // Log para debugging (opcional, puedes comentarlo en producción)
            if (process.env.NODE_ENV === 'development') {
                console.log('📝 Ejecutando query:', query.substring(0, 200) + '...');
            }
            
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('❌ [DATABASE] Error ejecutando consulta:', {
                query: query.substring(0, 100) + '...',
                error: error.message,
                code: error.code,
                sqlState: error.sqlState
            });
            
            // Intentar reconectar si es un error de conexión
            if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
                console.log('🔄 Intentando reconectar...');
                this.isConnected = false;
                await this.initialize();
                // Reintentar la consulta una vez
                const [rows] = await this.pool.execute(query, params);
                return rows;
            }
            
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
                    NOW() as server_time,
                    @@character_set_database as charset_database,
                    @@collation_database as collation_database
            `);
            return result[0];
        } catch (error) {
            console.error('❌ Error obteniendo información de conexión:', error.message);
            return null;
        }
    }

    async checkCharsetConfig() {
        try {
            const result = await this.execute(`
                SHOW VARIABLES LIKE 'character_set_%'
            `);
            
            console.log('🔤 Configuración de caracteres de la BD:');
            result.forEach(row => {
                console.log(`   ${row.Variable_name}: ${row.Value}`);
            });

            const collationResult = await this.execute(`
                SHOW VARIABLES LIKE 'collation_%'
            `);
            
            console.log('🔤 Configuración de collation de la BD:');
            collationResult.forEach(row => {
                console.log(`   ${row.Variable_name}: ${row.Value}`);
            });

            return { characterSets: result, collations: collationResult };
        } catch (error) {
            console.error('❌ Error verificando configuración de caracteres:', error);
            return null;
        }
    }

    async verifyAndFixUtf8() {
        try {
            console.log('🔍 Verificando configuración UTF-8...');
            
            const dbName = process.env.DB_NAME || 'bn1wjilwxf7lfij13vn4';
            
            // Verificar collation de la base de datos
            const dbConfig = await this.execute(`
                SELECT 
                    DEFAULT_CHARACTER_SET_NAME, 
                    DEFAULT_COLLATION_NAME 
                FROM information_schema.SCHEMATA 
                WHERE SCHEMA_NAME = ?
            `, [dbName]);
            
            console.log('📊 Configuración de la base de datos:', dbConfig[0]);

            // Verificar collation de las tablas
            const tablesConfig = await this.execute(`
                SELECT 
                    TABLE_NAME,
                    TABLE_COLLATION,
                    TABLE_COMMENT
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ?
            `, [dbName]);
            
            console.log('📋 Configuración de tablas:');
            tablesConfig.forEach(table => {
                console.log(`   ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
            });

            // Verificar collation de las columnas
            const columnsConfig = await this.execute(`
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CHARACTER_SET_NAME,
                    COLLATION_NAME
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = ?
                    AND CHARACTER_SET_NAME IS NOT NULL
            `, [dbName]);
            
            console.log('📝 Configuración de columnas con caracteres:');
            columnsConfig.forEach(column => {
                console.log(`   ${column.TABLE_NAME}.${column.COLUMN_NAME}: ${column.COLLATION_NAME}`);
            });

            console.log('✅ Verificación UTF-8 completada');
            return {
                database: dbConfig[0],
                tables: tablesConfig,
                columns: columnsConfig
            };
        } catch (error) {
            console.error('❌ Error en verificación UTF-8:', error);
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
        const result = await this.execute(query);
        return result;
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

    async createEntidad(nombre) {
        const query = 'INSERT INTO entidades (nombre) VALUES (?)';
        const result = await this.execute(query, [nombre]);
        return result.insertId;
    }

    async updateEntidad(id, nombre, estado) {
        const query = 'UPDATE entidades SET nombre = ?, estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        const result = await this.execute(query, [nombre, estado, id]);
        return result.affectedRows > 0;
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
                q.updated_at,
                (SELECT COUNT(*) FROM comentarios c WHERE c.queja_id = q.id) as total_comentarios
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
                q.updated_at,
                (SELECT COUNT(*) FROM comentarios c WHERE c.queja_id = q.id) as total_comentarios
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
            
            // Consulta con conteo de comentarios
            const query = `
                SELECT 
                    q.id,
                    q.entidad_id,
                    e.nombre as entidad_nombre,
                    q.descripcion,
                    q.created_at,
                    q.updated_at,
                    (SELECT COUNT(*) FROM comentarios c WHERE c.queja_id = q.id) as total_comentarios
                FROM quejas q 
                INNER JOIN entidades e ON q.entidad_id = e.id 
                WHERE q.entidad_id = ?
                ORDER BY q.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const limitInt = parseInt(limit, 10) || 50;
            const offsetInt = parseInt(offset, 10) || 0;
            
            return await this.execute(query, [entidadIdInt, limitInt, offsetInt]);
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

    async updateQueja(id, descripcion) {
        const query = 'UPDATE quejas SET descripcion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        const result = await this.execute(query, [descripcion, id]);
        return result.affectedRows > 0;
    }

    // ==================== MÉTODOS PARA COMENTARIOS ====================

    async getAllComentarios(quejaId) {
        const query = `
            SELECT 
                id,
                queja_id,
                texto,
                fecha_comentario,
                created_at,
                updated_at
            FROM comentarios 
            WHERE queja_id = ? 
            ORDER BY fecha_comentario ASC
        `;
        return await this.execute(query, [quejaId]);
    }

    async getComentarioById(id) {
        const query = `
            SELECT 
                c.id,
                c.queja_id,
                c.texto,
                c.fecha_comentario,
                c.created_at,
                c.updated_at,
                q.descripcion as queja_descripcion,
                e.nombre as entidad_nombre
            FROM comentarios c
            INNER JOIN quejas q ON c.queja_id = q.id
            INNER JOIN entidades e ON q.entidad_id = e.id
            WHERE c.id = ?
        `;
        const result = await this.execute(query, [id]);
        return result.length > 0 ? result[0] : null;
    }

    async createComentario(comentarioData) {
        const query = `
            INSERT INTO comentarios (queja_id, texto, fecha_comentario) 
            VALUES (?, ?, ?)
        `;
        
        // Si no se proporciona fecha_comentario, usar la fecha actual
        const fechaComentario = comentarioData.fecha_comentario || new Date();
        
        const result = await this.execute(query, [
            comentarioData.queja_id,
            comentarioData.texto,
            fechaComentario
        ]);
        
        // Obtener el comentario recién creado
        const newComentario = await this.getComentarioById(result.insertId);
        return {
            insertId: result.insertId,
            ...newComentario
        };
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

    async deleteComentario(id) {
        const query = 'DELETE FROM comentarios WHERE id = ?';
        const result = await this.execute(query, [id]);
        return result.affectedRows > 0;
    }

    async getComentariosCount(quejaId) {
        const query = 'SELECT COUNT(*) as count FROM comentarios WHERE queja_id = ?';
        const result = await this.execute(query, [quejaId]);
        return result[0].count;
    }

    // Obtener quejas con sus comentarios más recientes
    async getQuejasConComentariosRecientes(limit = 10) {
        const query = `
            SELECT 
                q.id,
                q.entidad_id,
                e.nombre as entidad_nombre,
                q.descripcion,
                q.created_at as queja_fecha,
                c.texto as ultimo_comentario,
                c.fecha_comentario as fecha_ultimo_comentario,
                (SELECT COUNT(*) FROM comentarios cc WHERE cc.queja_id = q.id) as total_comentarios
            FROM quejas q
            INNER JOIN entidades e ON q.entidad_id = e.id
            LEFT JOIN comentarios c ON q.id = c.queja_id 
            WHERE c.id = (
                SELECT MAX(cc.id) 
                FROM comentarios cc 
                WHERE cc.queja_id = q.id
            ) OR c.id IS NULL
            ORDER BY COALESCE(c.fecha_comentario, q.created_at) DESC
            LIMIT ?
        `;
        return await this.execute(query, [limit]);
    }

    // ==================== MÉTODOS PARA ESTADÍSTICAS ====================

    async getEstadisticasGenerales() {
        const queries = {
            totalQuejas: 'SELECT COUNT(*) as total FROM quejas',
            totalEntidades: 'SELECT COUNT(*) as total FROM entidades WHERE estado = true',
            totalComentarios: 'SELECT COUNT(*) as total FROM comentarios',
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
            `,
            comentariosHoy: `
                SELECT COUNT(*) as total 
                FROM comentarios 
                WHERE DATE(fecha_comentario) = CURDATE()
            `,
            comentariosMes: `
                SELECT COUNT(*) as total 
                FROM comentarios 
                WHERE MONTH(fecha_comentario) = MONTH(CURDATE()) 
                AND YEAR(fecha_comentario) = YEAR(CURDATE())
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
                COUNT(q.id) as count,
                COUNT(c.id) as total_comentarios
            FROM entidades e 
            LEFT JOIN quejas q ON e.id = q.entidad_id 
            LEFT JOIN comentarios c ON q.id = c.queja_id
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

    async getComentariosPorMes(limite = 12) {
        const query = `
            SELECT 
                DATE_FORMAT(fecha_comentario, '%Y-%m') as mes,
                COUNT(*) as count 
            FROM comentarios 
            GROUP BY DATE_FORMAT(fecha_comentario, '%Y-%m')
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

    // ==================== MÉTODOS DE UTILIDAD PARA UTF-8 ====================

    async testTildes() {
        try {
            console.log('🧪 Probando soporte de tildes...');
            
            // Insertar datos con tildes
            const testData = {
                entidad_id: 1,
                descripcion: 'Prueba de acentos: áéíóú ñÑ ¿? ¡! Çç ÁÉÍÓÚ àèìòù'
            };
            
            const result = await this.createQueja(testData);
            console.log('✅ Test de tildes insertado con ID:', result.insertId);
            
            // Recuperar para verificar
            const queja = await this.getQuejaById(result.insertId);
            console.log('📝 Datos recuperados:', queja.descripcion);
            
            // Verificar que coincidan
            if (queja.descripcion === testData.descripcion) {
                console.log('✅✅✅ Test de tildes EXITOSO - Los caracteres se conservan correctamente');
            } else {
                console.log('❌❌❌ Test de tildes FALLIDO - Los caracteres no coinciden');
                console.log('Original:', testData.descripcion);
                console.log('Recuperado:', queja.descripcion);
            }
            
            return queja;
            
        } catch (error) {
            console.error('❌ Error en test de tildes:', error);
            throw error;
        }
    }

    async fixDatabaseCharset() {
        try {
            console.log('🔧 Intentando corregir configuración de caracteres...');
            
            // Cambiar la base de datos a utf8mb4
            await this.execute(`ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            
            // Cambiar las tablas a utf8mb4
            const tables = ['entidades', 'quejas', 'comentarios'];
            
            for (const table of tables) {
                await this.execute(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
                console.log(`✅ Tabla ${table} convertida a utf8mb4`);
            }
            
            console.log('✅ Configuración de caracteres corregida');
            return true;
            
        } catch (error) {
            console.error('❌ Error corrigiendo configuración de caracteres:', error);
            return false;
        }
    }
}

module.exports = new DatabaseService();