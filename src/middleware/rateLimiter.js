const rateLimit = require('express-rate-limit');

// Rate limiter para consultas GET
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

// Rate limiter para creación de quejas y comentarios
const complaintsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 creaciones por ventana
    message: {
        success: false,
        message: 'Has alcanzado el límite de quejas. Por favor intenta más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter global - MUY permisivo (solo para casos extremos)
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // 1000 peticiones por minuto
    message: {
        success: false,
        message: 'Límite de peticiones excedido temporalmente.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const adminLimiter = (req, res, next) => {
    // Bypass completo para operaciones administrativas
    console.log(`🔓 [ADMIN] ${req.method} ${req.path} - Sin límite`);
    next();
};

module.exports = {
    globalLimiter,
    consultLimiter,
    complaintsLimiter,
    adminLimiter
};