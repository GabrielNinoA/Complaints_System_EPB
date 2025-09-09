const express = require('express');
const router = express.Router();

// Importar controllers
const entidadesController = require('../controllers/entidadesController');
const quejasController = require('../controllers/quejasController');
const estadisticasController = require('../controllers/estadisticasController');

// Importar middleware
const { globalLimiter, complaintsLimiter, consultLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Aplicar rate limiting global
router.use(globalLimiter);

// ==================== INFORMACIÓN DE LA API ====================

// Información básica de la API
router.get('/', (req, res) => {
    res.json({
        name: 'Sistema de Quejas Boyacá API',
        version: '2.1.0',
        description: 'API para gestión de quejas ciudadanas - Departamento de Boyacá',
        endpoints: {
            entidades: '/api/entidades',
            quejas: '/api/quejas',
            estadisticas: '/api/estadisticas',
            health: '/api/health'
        },
        documentation: '/api/docs',
        timestamp: new Date().toISOString()
    });
});

// Health check
router.get('/health', asyncHandler(estadisticasController.healthCheck));

// ==================== RUTAS DE ENTIDADES ====================

router.get('/entidades', 
    consultLimiter,
    (req, res, next) => {
        console.log('🔍 [ROUTE] Ruta /api/entidades ejecutándose...');
        next();
    },
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

// Ruta administrativa para eliminar quejas
router.delete('/quejas/:id', 
    asyncHandler(quejasController.deleteQueja)
);

// Ruta administrativa para actualizar estado de queja  
router.patch('/quejas/:id/estado', 
    asyncHandler(quejasController.updateQuejaStatus)
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

// Ruta para consultar resumen de auditoría (admin)
router.get('/auditoria/resumen', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        // TODO: Implementar sistema de auditoría
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

// Rutas alternativas para compatibilidad con frontend existente
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
