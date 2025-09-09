const rateLimit = require('express-rate-limit');

// Rate limiting global para toda la API
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Más restrictivo en producción
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP. Intente de nuevo más tarde.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Rate limit alcanzado para IP: ${req.ip} - ${req.originalUrl}`);
        res.status(429).json({
            success: false,
            message: 'Demasiadas solicitudes desde esta IP. Intente de nuevo más tarde.',
            retryAfter: '15 minutes',
            timestamp: new Date().toISOString()
        });
    }
});

// Rate limiting específico para crear quejas (más restrictivo)
const complaintsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 10 : 50, // Muy restrictivo en producción
    message: {
        success: false,
        message: 'Límite de quejas alcanzado. Puede enviar máximo 10 quejas cada 15 minutos.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Límite de quejas alcanzado para IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Límite de quejas alcanzado. Puede enviar máximo 10 quejas cada 15 minutos.',
            retryAfter: '15 minutes',
            timestamp: new Date().toISOString()
        });
    }
});

// Rate limiting para consultas (más permisivo)
const consultLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 200,
    message: {
        success: false,
        message: 'Demasiadas consultas. Intente de nuevo en unos minutos.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    globalLimiter,
    complaintsLimiter,
    consultLimiter
};
