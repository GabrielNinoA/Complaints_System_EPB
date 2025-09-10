require('dotenv').config();
const express = require('express');
const compression = require('compression');
const apiRoutes = require('./src/routes/api');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE DE SEGURIDAD ====================

// Compresión de respuestas
app.use(compression());

// ==================== MIDDLEWARE DE PARSEO ====================

// Parseo de JSON con límite de tamaño
app.use(express.json({ 
    limit: '1mb',
    strict: true 
}));

// Parseo de URL encoded
app.use(express.urlencoded({ 
    extended: true, 
    limit: '1mb' 
}));

// ==================== MIDDLEWARE DE LOGGING ====================

// Logger de requests
app.use(requestLogger);

// Trust proxy para obtener IP real (necesario para Render)
app.set('trust proxy', 1);

// ==================== ARCHIVOS ESTÁTICOS ====================

// Servir archivos estáticos del frontend (solo en producción)
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    
    // Servir archivos estáticos desde frontend/build con configuración de MIME types
    app.use(express.static(path.join(__dirname, 'frontend/build'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            }
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
            if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            }
        }
    }));
}

// ==================== RUTAS ====================

// Health check básico
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version
    });
});

// Rutas de la API - IMPORTANTE: ANTES del catchall del frontend
app.use('/api', apiRoutes);

// Frontend routing - DESPUÉS de las rutas API
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    
    // Manejar rutas del frontend (SPA routing) - TODAS las rutas que no sean API
    app.get('*', (req, res) => {
        // Evitar interceptar rutas de la API y health
        if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
            res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
        }
    });
}

// Ruta raíz
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        // En producción, servir la aplicación frontend directamente
        res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
    } else {
        // En desarrollo, mostrar info de la API
        res.json({
            name: 'Sistema de Quejas Boyacá API',
            version: require('./package.json').version,
            status: 'running',
            endpoints: {
                health: '/health',
                api: '/api',
                docs: '/api/docs',
                app: '/ (solo en producción)'
            }
        });
    }
});

// ==================== MANEJO DE ERRORES ====================

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// ==================== INICIO DEL SERVIDOR ====================

async function startServer() {
    try {
        // Verificar conexión a base de datos
        const dbConfig = require('./src/config/database');
        console.log('🔍 Verificando conexión a base de datos...');
        console.log('🔧 Configuración DB:', dbConfig.getConnectionInfo());
        
        const dbConnected = await dbConfig.testConnection();
        if (!dbConnected) {
            console.warn('⚠️  No se pudo conectar a la base de datos, pero continuando...');
        } else {
            console.log('✅ Conexión a base de datos exitosa');
            
            // Verificar si las tablas existen y crear datos de prueba
            console.log('🔍 Verificando estructura de base de datos...');
            const dbService = require('./src/services/database');
            try {
                await dbService.initialize();
                
                // Verificar si la tabla entidades existe
                const tables = await dbService.execute("SHOW TABLES LIKE 'entidades'");
                if (tables.length === 0) {
                    console.log('⚠️  Tabla entidades no existe, creándola...');
                    await dbService.execute(`
                        CREATE TABLE IF NOT EXISTS entidades (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            nombre VARCHAR(255) NOT NULL UNIQUE,
                            estado BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_nombre (nombre),
                            INDEX idx_estado (estado)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    `);
                    
                    // Insertar entidades base
                    await dbService.execute(`
                        INSERT INTO entidades (nombre, estado) VALUES
                        ('CORPOBOYACA', true),
                        ('LOTERIA DE BOYACA', true),
                        ('EBSA', true),
                        ('ITBOY', true),
                        ('INDEPORTES', true),
                        ('ALCALDIA MUNICIPAL', true),
                        ('SECRETARIA DE SALUD', true)
                    `);
                    console.log('✅ Tabla entidades creada e inicializada');
                } else {
                    console.log('✅ Tabla entidades existe');
                }
                
                // Verificar datos
                const entidades = await dbService.getAllEntidades();
                console.log('✅ Entidades disponibles:', entidades.length);
                
            } catch (dbError) {
                console.error('❌ Error verificando base de datos:', dbError.message);
            }
        }
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n🚀 ===================================');
            console.log('   SISTEMA DE QUEJAS BOYACÁ v2.0');
            console.log('🚀 ===================================');
            console.log(`📍 Servidor: http://localhost:${PORT}`);
            console.log(`📱 API: http://localhost:${PORT}/api`);
            console.log(`💚 Health: http://localhost:${PORT}/health`);
            console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log('=====================================\n');
        });

        // Manejo de cierre graceful
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Recibida señal ${signal}, cerrando servidor...`);
            
            server.close(() => {
                console.log('✅ Servidor HTTP cerrado');
                process.exit(0);
            });

            // Forzar cierre después de 30 segundos
            setTimeout(() => {
                console.error('❌ Forzando cierre del servidor');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Manejo de errores no capturados
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
if (require.main === module) {
    startServer();
}

module.exports = app;
