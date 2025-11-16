require('dotenv').config();
const express = require('express');
const compression = require('compression');
const apiRoutes = require('./src/routes/api');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');
const kafkaProducer = require('./src/services/kafkaProducer');
const kafkaConsumer = require('./src/services/kafkaConsumer');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE DE CORS MANUAL ====================

// CORS manual sin usar el paquete cors
app.use((req, res, next) => {
    // Permitir todos los orígenes en desarrollo, específicos en producción
    const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [
            'https://complaints-system-epb-feature.onrender.com',
            'https://complaints-system-epb.onrender.com',
            process.env.FRONTEND_URL
          ].filter(Boolean)
        : [
            'http://localhost:3000', 
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
          ];

    const origin = req.headers.origin;
    
    // Permitir el origen si está en la lista o si estamos en desarrollo
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    // Métodos permitidos - IMPORTANTE: incluir DELETE, PUT, PATCH
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    
    // Headers permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Permitir credenciales
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Tiempo de caché para preflight requests (24 horas)
    res.setHeader('Access-Control-Max-Age', '86400');

    // Manejar preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// ==================== MIDDLEWARE DE SEGURIDAD ====================

// Compresión de respuestas
app.use(compression());

// Trust proxy para obtener IP real (necesario para Render)
app.set('trust proxy', 1);

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

// Ruta raíz
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        const path = require('path');
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
                
                // Verificar tabla de comentarios
                const comentariosTable = await dbService.execute("SHOW TABLES LIKE 'comentarios'");
                if (comentariosTable.length === 0) {
                    console.log('⚠️  Tabla comentarios no existe, creándola...');
                    await dbService.execute(`
                        CREATE TABLE IF NOT EXISTS comentarios (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            queja_id INT NOT NULL,
                            texto TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (queja_id) REFERENCES quejas(id) ON DELETE CASCADE,
                            INDEX idx_queja (queja_id),
                            INDEX idx_created_at (created_at)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    `);
                    console.log('✅ Tabla comentarios creada');
                } else {
                    console.log('✅ Tabla comentarios existe');
                }
                
                // Verificar tabla de historial_acciones
                const historialTable = await dbService.execute("SHOW TABLES LIKE 'historial_acciones'");
                if (historialTable.length === 0) {
                    console.log('⚠️  Tabla historial_acciones no existe, creándola...');
                    await dbService.execute(`
                        CREATE TABLE IF NOT EXISTS historial_acciones (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            tipo_accion ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
                            entidad_afectada ENUM('quejas', 'entidades', 'comentarios') NOT NULL,
                            registro_id INT NOT NULL,
                            datos_anteriores JSON NULL,
                            datos_nuevos JSON NULL,
                            usuario VARCHAR(255) DEFAULT 'sistema',
                            ip_address VARCHAR(45) NULL,
                            user_agent TEXT NULL,
                            kafka_offset BIGINT NULL,
                            kafka_partition INT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_tipo_accion (tipo_accion),
                            INDEX idx_entidad_afectada (entidad_afectada),
                            INDEX idx_registro_id (registro_id),
                            INDEX idx_created_at (created_at),
                            INDEX idx_entidad_registro (entidad_afectada, registro_id),
                            INDEX idx_usuario (usuario)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    `);
                    console.log('✅ Tabla historial_acciones creada');
                } else {
                    console.log('✅ Tabla historial_acciones existe');
                }
                
            } catch (dbError) {
                console.error('❌ Error verificando base de datos:', dbError.message);
            }
        }
        
        // ==================== INICIALIZAR KAFKA ====================
        // Inicializar Kafka Producer y Consumer
        const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false'; // Por defecto habilitado
        
        if (kafkaEnabled) {
            try {
                console.log('\n📨 Inicializando Kafka...');
                
                // Conectar Producer
                await kafkaProducer.connect();
                console.log('✅ Kafka Producer inicializado');
                
                // Conectar y arrancar Consumer
                await kafkaConsumer.connect();
                await kafkaConsumer.start();
                console.log('✅ Kafka Consumer iniciado y escuchando eventos');
                
            } catch (kafkaError) {
                console.error('❌ Error inicializando Kafka:', kafkaError.message);
                console.warn('⚠️  El sistema continuará sin Kafka. Los registros no se guardarán en el historial.');
            }
        } else {
            console.log('ℹ️  Kafka deshabilitado (KAFKA_ENABLED=false)');
        }
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n🚀 ===================================');
            console.log('   SISTEMA DE QUEJAS BOYACÁ v2.2');
            console.log('🚀 ===================================');
            console.log(`📍 Servidor: http://localhost:${PORT}`);
            console.log(`📱 API: http://localhost:${PORT}/api`);
            console.log(`💚 Health: http://localhost:${PORT}/health`);
            console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS: Configurado para DELETE/PUT/PATCH`);
            console.log('=====================================\n');
        });

        // Manejo de cierre graceful
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Recibida señal ${signal}, cerrando servidor...`);
            
            // Desconectar Kafka
            if (kafkaEnabled) {
                try {
                    await kafkaProducer.disconnect();
                    await kafkaConsumer.disconnect();
                    console.log('✅ Kafka desconectado');
                } catch (kafkaError) {
                    console.error('❌ Error desconectando Kafka:', kafkaError.message);
                }
            }
            
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