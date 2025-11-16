const express = require('express');
const router = express.Router();

// Importar controllers
const entidadesController = require('../controllers/entidadesController');
const quejasController = require('../controllers/quejasController');
const comentariosController = require('../controllers/comentariosController');
const estadisticasController = require('../controllers/estadisticasController');
const historialController = require('../controllers/historialController');

// Importar middleware
const { globalLimiter, complaintsLimiter, consultLimiter, adminLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// ⚠️ NO aplicar globalLimiter aquí - se aplicará selectivamente
// router.use(globalLimiter); // COMENTADO PARA EVITAR BLOQUEOS

// ==================== INFORMACIÓN DE LA API ====================

router.get('/', (req, res) => {
    res.json({
        name: 'Sistema de Quejas Boyacá API',
        version: '2.2.0',
        description: 'API para gestión de quejas ciudadanas - Departamento de Boyacá',
        endpoints: {
            entidades: '/api/entidades',
            quejas: '/api/quejas',
            comentarios: '/api/comentarios',
            estadisticas: '/api/estadisticas',
            health: '/api/health',
            testEmail: '/api/test-email'
        },
        documentation: '/api/docs',
        timestamp: new Date().toISOString()
    });
});

router.get('/health', asyncHandler(estadisticasController.healthCheck));

router.get('/test-email', asyncHandler(estadisticasController.testEmail));

// ==================== RUTAS DE ENTIDADES ====================

router.get('/entidades', 
    consultLimiter,
    asyncHandler(entidadesController.getAllEntidades)
);

router.get('/entidades/:id', 
    consultLimiter,
    asyncHandler(entidadesController.getEntidadById)
);

// ==================== RUTAS DE QUEJAS ====================

router.get('/quejas', 
    consultLimiter,
    asyncHandler(quejasController.getAllQuejas)
);

router.get('/quejas/:id', 
    consultLimiter,
    asyncHandler(quejasController.getQuejaById)
);

router.post('/quejas', 
    complaintsLimiter,
    asyncHandler(quejasController.createQueja)
);

router.get('/quejas/entidad/:entidadId', 
    consultLimiter,
    asyncHandler(quejasController.getQuejasByEntidad)
);

// 🔥 RUTAS ADMINISTRATIVAS - SIN RATE LIMITING RESTRICTIVO
router.delete('/quejas/:id', 
    (req, res, next) => {
        console.log(`🗑️  [DELETE QUEJA] ID: ${req.params.id} - IP: ${req.ip}`);
        next();
    },
    asyncHandler(quejasController.deleteQueja)
);

router.patch('/quejas/:id/estado', 
    (req, res, next) => {
        console.log(`📝 [PATCH QUEJA] ID: ${req.params.id} - Estado: ${req.body.estado}`);
        next();
    },
    asyncHandler(quejasController.updateQuejaStatus)
);

// ==================== RUTAS DE COMENTARIOS ====================

// Obtener todos los comentarios de una queja
router.get('/quejas/:quejaId/comentarios', 
    consultLimiter,
    asyncHandler(comentariosController.getComentariosByQueja)
);

// Crear un nuevo comentario en una queja
router.post('/quejas/:quejaId/comentarios', 
    complaintsLimiter,
    asyncHandler(comentariosController.createComentario)
);

// Obtener un comentario específico por ID
router.get('/comentarios/:id', 
    consultLimiter,
    asyncHandler(comentariosController.getComentarioById)
);

// Actualizar un comentario
router.put('/comentarios/:id',
    (req, res, next) => {
        console.log(`✏️  [PUT COMENTARIO] ID: ${req.params.id}`);
        next();
    },
    asyncHandler(comentariosController.updateComentario)
);

// Eliminar un comentario
router.delete('/comentarios/:id',
    (req, res, next) => {
        console.log(`🗑️  [DELETE COMENTARIO] ID: ${req.params.id}`);
        next();
    },
    asyncHandler(comentariosController.deleteComentario)
);

// ==================== RUTAS DE ESTADÍSTICAS ====================

router.get('/estadisticas', 
    consultLimiter,
    asyncHandler(estadisticasController.getEstadisticasGenerales)
);

router.get('/reportes', 
    consultLimiter,
    asyncHandler(estadisticasController.getReportes)
);

router.get('/reportes/csv', 
    consultLimiter,
    asyncHandler(estadisticasController.getReporteCSV)
);

// ==================== RUTAS DE AUDITORÍA ====================

// ==================== RUTAS DE HISTORIAL DE ACCIONES ====================

// Obtener todos los registros históricos con filtros y paginación
router.get('/historial',
    consultLimiter,
    asyncHandler(historialController.getAllHistorial)
);

// Obtener estadísticas del historial
router.get('/historial/stats',
    consultLimiter,
    asyncHandler(historialController.getHistorialStats)
);

// Obtener estadísticas del consumer de Kafka
router.get('/historial/consumer/stats',
    consultLimiter,
    asyncHandler(historialController.getConsumerStats)
);

// Obtener historial de una entidad específica
router.get('/historial/:entidad/:id',
    consultLimiter,
    asyncHandler(historialController.getHistorialByEntity)
);

// ==================== RUTAS DE AUDITORÍA (LEGACY) ====================

router.get('/auditoria/resumen', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        res.json({
            success: true,
            data: {
                message: 'Sistema de auditoría en desarrollo',
                days: days
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en consulta de auditoría',
            error: error.message
        });
    }
});

// ==================== RUTAS DE COMPATIBILIDAD ====================

router.get('/complaints', 
    consultLimiter,
    asyncHandler(quejasController.getAllQuejas)
);

router.get('/complaints/:id', 
    consultLimiter,
    asyncHandler(quejasController.getQuejaById)
);

router.post('/complaints', 
    complaintsLimiter,
    asyncHandler(quejasController.createQueja)
);

router.get('/entities', 
    consultLimiter,
    asyncHandler(entidadesController.getAllEntidades)
);

module.exports = router;