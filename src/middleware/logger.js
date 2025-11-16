// Middleware para logging de requests
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Solo loggear requests importantes (POST, PUT, DELETE, PATCH) o rutas específicas
    const shouldLog = method !== 'GET' || 
                     url.includes('/historial') || 
                     url.includes('/stats');

    if (shouldLog) {
        console.log(`📡 [${method}] ${url} | IP: ${ip.substring(0, 15)}`);
    }

    // Agregar timestamp al request para medir tiempo de respuesta
    req.startTime = Date.now();

    // Interceptar la respuesta para loggear el tiempo
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - req.startTime;
        
        // Solo loguear requests lentos
        if (responseTime > 1000) {
            console.log(`⏱️  [SLOW] ${method} ${url} - ${responseTime}ms`);
        }
        
        originalSend.call(this, data);
    };

    next();
};

// Middleware para logging de errores
const errorLogger = (error, req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || 'unknown';
    const stack = process.env.NODE_ENV === 'development' ? error.stack : error.message;

    console.error(`[${timestamp}] ERROR: ${method} ${url} - IP: ${ip}`);
    console.error(`Message: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(`Stack: ${stack}`);
    }

    next(error);
};

module.exports = {
    requestLogger,
    errorLogger
};
