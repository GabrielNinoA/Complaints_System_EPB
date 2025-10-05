const { errorLogger } = require('./logger');

// Middleware para capturar errores asíncronos
const asyncHandler = (fn) => (req, res, next) => {
    console.log('🔍 [ASYNC] AsyncHandler ejecutándose para:', req.path);
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res) => {
    const isApiRequest = req.originalUrl.startsWith('/api/');
    
    if (isApiRequest || req.accepts('json')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado',
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }
    
    // Para requests no-API, devolver respuesta simple
    res.status(404).json({
        error: 'Página no encontrada',
        status: 404
    });
};

// Middleware para manejo global de errores
const errorHandler = (error, req, res, next) => {
    // Log del error
    errorLogger(error, req, res, () => {});

    // Si ya se enviaron headers, delegar al error handler por defecto
    if (res.headersSent) {
        return next(error);
    }

    // Determinar el código de estado
    let statusCode = error.status || error.statusCode || 500;
    
    // Manejar errores específicos
    if (error.code === 'ECONNREFUSED') {
        statusCode = 503;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        statusCode = 503;
    } else if (error.name === 'ValidationError') {
        statusCode = 400;
    } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
    }

    // Preparar respuesta de error
    const errorResponse = {
        success: false,
        message: getErrorMessage(error, statusCode),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // En desarrollo, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = error.message;
    }

    // En producción, incluir ID de error para tracking
    if (process.env.NODE_ENV === 'production') {
        errorResponse.errorId = generateErrorId();
    }

    res.status(statusCode).json(errorResponse);
};

// Función para obtener mensaje de error apropiado
function getErrorMessage(error, statusCode) {
    if (process.env.NODE_ENV === 'development') {
        return error.message;
    }

    // Mensajes de error seguros para producción
    switch (statusCode) {
        case 400:
            return 'Solicitud inválida';
        case 401:
            return 'No autorizado';
        case 403:
            return 'Acceso prohibido';
        case 404:
            return 'Recurso no encontrado';
        case 429:
            return 'Demasiadas solicitudes';
        case 503:
            return 'Servicio temporalmente no disponible';
        default:
            return 'Error interno del servidor';
    }
}

// Función para generar ID único de error
function generateErrorId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`;
}

module.exports = {
    asyncHandler,
    notFoundHandler,
    errorHandler
};