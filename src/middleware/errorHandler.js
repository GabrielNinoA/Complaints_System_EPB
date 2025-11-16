
function logError(error, req, context = '') {
    const method = req?.method || 'UNKNOWN';
    const path = req?.originalUrl || req?.url || 'UNKNOWN';
    const ip = req?.ip || req?.connection?.remoteAddress || 'UNKNOWN';
    
    console.error(`❌ [ERROR] ${method} ${path} | ${error.message}`);
    
    if (context) {
        console.error(`   Context: ${context}`);
    }
    
    if (process.env.NODE_ENV === 'development' && error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[0]}`);
    }
}


function generateErrorId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`;
}


function getErrorMessage(error, statusCode) {
    if (process.env.NODE_ENV === 'development') {
        return error.message;
    }

    const messages = {
        400: 'Solicitud inválida',
        401: 'No autorizado',
        403: 'Acceso prohibido',
        404: 'Recurso no encontrado',
        429: 'Demasiadas solicitudes',
        503: 'Servicio temporalmente no disponible'
    };

    return messages[statusCode] || 'Error interno del servidor';
}


function getStatusCode(error) {
    if (error.status || error.statusCode) {
        return error.status || error.statusCode;
    }

    const errorCodeMap = {
        'ECONNREFUSED': 503,
        'ETIMEDOUT': 504,
        'ENOTFOUND': 503,
        'ER_ACCESS_DENIED_ERROR': 503,
        'ER_BAD_DB_ERROR': 503
    };

    if (error.code && errorCodeMap[error.code]) {
        return errorCodeMap[error.code];
    }

    const errorNameMap = {
        'ValidationError': 400,
        'UnauthorizedError': 401,
        'ForbiddenError': 403,
        'NotFoundError': 404
    };

    if (error.name && errorNameMap[error.name]) {
        return errorNameMap[error.name];
    }

    return 500;
}


const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


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
    
    res.status(404).json({
        error: 'Página no encontrada',
        status: 404
    });
};


const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    logError(error, req, 'Global Error Handler');

    const statusCode = getStatusCode(error);

    const errorResponse = {
        success: false,
        message: getErrorMessage(error, statusCode),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = error.message;
        if (error.code) errorResponse.code = error.code;
    }

    if (process.env.NODE_ENV === 'production') {
        errorResponse.errorId = generateErrorId();
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = {
    asyncHandler,
    notFoundHandler,
    errorHandler,
    logError, 
    generateErrorId,
    getErrorMessage,
    getStatusCode
};