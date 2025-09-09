require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const apiRoutes = require('./src/routes/api');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE DE SEGURIDAD ====================

// Compresión de respuestas
app.use(compression());

// Configuración de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL?.split(',') || ['https://quejas-boyaca.onrender.com']
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

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

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        name: 'Sistema de Quejas Boyacá API',
        version: require('./package.json').version,
        status: 'running',
        endpoints: {
            health: '/health',
            api: '/api',
            docs: '/api/docs'
        }
    });
});

// ==================== MANEJO DE ERRORES ====================

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// ==================== INICIO DEL SERVIDOR ====================

async function startServer() {
    try {
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
