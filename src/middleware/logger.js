// Middleware para logging de requests
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = (req.get('User-Agent') || 'unknown').substring(0, 100);

    // En desarrollo, loggear todos los requests
    // En producción, solo loggear requests importantes
    const shouldLog = process.env.NODE_ENV !== 'production' || 
                     method !== 'GET' || 
                     url.includes('/api/');

    if (shouldLog) {
        console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
    }

    // Agregar timestamp al request para medir tiempo de respuesta
    req.startTime = Date.now();

    // Interceptar la respuesta para loggear el tiempo
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - req.startTime;
        
        if (shouldLog && responseTime > 1000) { // Log slow requests
            console.log(`⚠️  Slow request: ${method} ${url} - ${responseTime}ms`);
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
