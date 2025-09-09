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

// Configuración de seguridad con Helmet - DESACTIVADO TEMPORALMENTE PARA TESTING
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'"],
//             imgSrc: ["'self'", "data:", "https:"],
//             connectSrc: ["'self'"],
//             fontSrc: ["'self'"],
//             objectSrc: ["'none'"],
//             mediaSrc: ["'self'"],
//             frameSrc: ["'none'"]
//         }
//     },
//     crossOriginEmbedderPolicy: false
// }));

// Configuración de CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? false // En producción, frontend y backend están en el mismo dominio
        : ['http://localhost:3000', 'http://127.0.0.1:3000'], // En desarrollo, permitir frontend local
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
    
    // Manejar rutas del frontend (SPA routing)
    app.get('/app/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
    });
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

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        // En producción, redirigir a la aplicación frontend
        res.redirect('/app');
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
                app: '/app (solo en producción)'
            }
        });
    }
});

// Catch-all handler para rutas del frontend (debe ir al final)
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.get('*', (req, res) => {
        // Evitar interceptar rutas de la API
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
