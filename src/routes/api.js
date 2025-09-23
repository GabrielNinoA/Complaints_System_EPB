const express = require('express');
const router = express.Router();

// Importar controllers
const entidadesController = require('../controllers/entidadesController');
const quejasController = require('../controllers/quejasController');
const comentariosController = require('../controllers/comentariosController');
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
            comentarios: '/api/comentarios',
            estadisticas: '/api/estadisticas',
            health: '/api/health'
        },
        features: [
            'Gestión de quejas',
            'Gestión de comentarios',
            'Estadísticas y reportes',
            'Rate limiting',
            'Paginación'
        ],
        documentation: '/api/docs',
        timestamp: new Date().toISOString()
    });
});

// Health check
router.get('/health', asyncHandler(estadisticasController.healthCheck));

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

// Ruta administrativa para eliminar quejas
router.delete('/quejas/:id', 
    asyncHandler(quejasController.deleteQueja)
);

// Ruta administrativa para actualizar estado de queja  
router.patch('/quejas/:id/estado', 
    asyncHandler(quejasController.updateQuejaStatus)
);

// ==================== RUTAS DE COMENTARIOS ====================

// Obtener todos los comentarios de una queja específica
router.get('/comentarios/queja/:quejaId', 
    consultLimiter,
    asyncHandler(comentariosController.getComentariosByQueja)
);

// Obtener comentario específico por ID
router.get('/comentarios/:id', 
    consultLimiter,
    asyncHandler(comentariosController.getComentarioById)
);

// Crear nuevo comentario
router.post('/comentarios', 
    complaintsLimiter,
    asyncHandler(comentariosController.createComentario)
);

// Actualizar comentario existente
router.put('/comentarios/:id', 
    complaintsLimiter,
    asyncHandler(comentariosController.updateComentario)
);

// Eliminar comentario
router.delete('/comentarios/:id', 
    asyncHandler(comentariosController.deleteComentario)
);

// Buscar comentarios por rango de fechas
router.get('/comentarios/buscar/fecha', 
    consultLimiter,
    asyncHandler(comentariosController.getComentariosByDateRange)
);

// Estadísticas de comentarios
router.get('/comentarios/estadisticas/resumen', 
    consultLimiter,
    asyncHandler(comentariosController.getEstadisticasComentarios)
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
                days: days,
                features_implementadas: [
                    'Gestión de quejas',
                    'Sistema de comentarios',
                    'Estadísticas básicas',
                    'Rate limiting'
                ]
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

// ==================== RUTAS COMBINADAS ====================

// Obtener queja con sus comentarios (endpoint conveniente)
router.get('/quejas/:id/comentarios', 
    consultLimiter,
    asyncHandler(async (req, res) => {
        try {
            const startTime = Date.now();
            
            const quejaId = parseInt(req.params.id);
            if (isNaN(quejaId) || quejaId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de queja inválido'
                });
            }

            // Obtener queja y comentarios en paralelo
            const [queja, comentarios] = await Promise.all([
                dbService.getQuejaById(quejaId),
                dbService.getAllComentarios(quejaId)
            ]);

            if (!queja) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            res.json({
                success: true,
                data: {
                    queja: queja,
                    comentarios: comentarios,
                    resumen: {
                        total_comentarios: comentarios.length,
                        ultimo_comentario: comentarios.length > 0 ? 
                            comentarios[comentarios.length - 1].fecha_comentario : null
                    }
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo queja con comentarios:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo queja con comentarios',
                timestamp: new Date().toISOString()
            });
        }
    })
);

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

// Rutas de compatibilidad para comentarios
router.get('/comments/complaint/:quejaId', 
    consultLimiter,
    asyncHandler(comentariosController.getComentariosByQueja)
);

router.post('/comments', 
    complaintsLimiter,
    asyncHandler(comentariosController.createComentario)
);

// ==================== MIDDLEWARE DE DOCUMENTACIÓN ====================

// Endpoint de documentación básica
router.get('/docs', (req, res) => {
    res.json({
        name: 'Sistema de Quejas Boyacá - Documentación API',
        version: '2.1.0',
        base_url: req.protocol + '://' + req.get('host') + '/api',
        endpoints: {
            entidades: {
                'GET /entidades': 'Obtener todas las entidades',
                'GET /entidades/:id': 'Obtener entidad por ID'
            },
            quejas: {
                'GET /quejas': 'Obtener todas las quejas (con paginación)',
                'GET /quejas/:id': 'Obtener queja por ID',
                'POST /quejas': 'Crear nueva queja',
                'GET /quejas/entidad/:entidadId': 'Obtener quejas por entidad',
                'DELETE /quejas/:id': 'Eliminar queja (admin)',
                'PATCH /quejas/:id/estado': 'Actualizar estado (admin)'
            },
            comentarios: {
                'GET /comentarios/queja/:quejaId': 'Obtener comentarios de una queja',
                'GET /comentarios/:id': 'Obtener comentario por ID',
                'POST /comentarios': 'Crear nuevo comentario',
                'PUT /comentarios/:id': 'Actualizar comentario',
                'DELETE /comentarios/:id': 'Eliminar comentario',
                'GET /comentarios/buscar/fecha': 'Buscar por rango de fechas',
                'GET /comentarios/estadisticas/resumen': 'Estadísticas de comentarios'
            },
            estadisticas: {
                'GET /estadisticas': 'Estadísticas generales',
                'GET /reportes': 'Reportes del sistema',
                'GET /reportes/csv': 'Exportar reporte en CSV'
            },
            combinadas: {
                'GET /quejas/:id/comentarios': 'Queja con todos sus comentarios'
            }
        },
        rate_limits: {
            global: '500 requests per 15 minutes',
            complaints: '10 requests per 15 minutes',
            consult: '100 requests per 5 minutes'
        },
        response_format: {
            success: {
                success: true,
                data: '...',
                timestamp: '2024-01-01T00:00:00.000Z'
            },
            error: {
                success: false,
                message: 'Error description',
                timestamp: '2024-01-01T00:00:00.000Z'
            }
        }
    });
});

module.exports = router;