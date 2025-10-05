const rateLimit = require('express-rate-limit');

// Rate limiter global - más permisivo
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite muy alto para peticiones normales
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Excluir rutas de administración del rate limiting
    skip: (req) => {
        const adminRoutes = ['/api/quejas/', '/api/comentarios/'];
        return adminRoutes.some(route => 
            req.path.includes(route) && 
            ['DELETE', 'PUT', 'PATCH'].includes(req.method)
        );
    }
});

// Rate limiter para consultas - muy permisivo
const consultLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 500, // 500 peticiones por ventana
    message: {
        success: false,
        message: 'Demasiadas consultas, por favor espera un momento.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para creación de quejas
const complaintsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 quejas por ventana
    message: {
        success: false,
        message: 'Has alcanzado el límite de quejas por hora. Por favor intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para operaciones administrativas - SIN LÍMITE
const adminLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 operaciones por minuto (muy permisivo)
    message: {
        success: false,
        message: 'Demasiadas operaciones administrativas.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    globalLimiter,
    consultLimiter,
    complaintsLimiter,
    adminLimiter
};