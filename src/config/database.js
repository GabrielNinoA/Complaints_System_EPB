const mysql = require('mysql2/promise');

class DatabaseConfig {
    constructor() {
        this.config = {
            host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST,
            port: parseInt(process.env.MYSQL_ADDON_PORT || process.env.DB_PORT) || 3306,
            user: process.env.MYSQL_ADDON_USER || process.env.DB_USER,
            password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD,
            database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME,
            charset: 'utf8mb4',
            timezone: 'Z',
            dateStrings: true,
            multipleStatements: false,
            
            // Configuraciones de conexión (solo las válidas para MySQL2)
            connectTimeout: 60000,
            
            // Pool de conexiones para mejor rendimiento
            connectionLimit: 1,
            queueLimit: 0,
            
            // Configuración SSL para Clever Cloud
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false
        };
    }

    getConfig() {
        return this.config;
    }

    async testConnection() {
        try {
            const connection = await mysql.createConnection(this.config);
            await connection.ping();
            await connection.end();
            return true;
        } catch (error) {
            console.error('❌ Error de conexión a la base de datos:', error.message);
            return false;
        }
    }

    getConnectionInfo() {
        return {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            charset: this.config.charset,
            environment: process.env.NODE_ENV || 'development'
        };
    }
}

module.exports = new DatabaseConfig();
