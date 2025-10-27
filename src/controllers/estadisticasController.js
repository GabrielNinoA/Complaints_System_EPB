const dbService = require('../services/database');

let emailService = null;
try {
    emailService = require('../services/emailService');
} catch (error) {
    console.warn('⚠️  Servicio de email no disponible:', error.message);
}

class EstadisticasController {
    constructor() {
        this.getEstadisticasGenerales = this.getEstadisticasGenerales.bind(this);
        this.getQuejasPorEntidad = this.getQuejasPorEntidad.bind(this);
        this.getTendenciaMensual = this.getTendenciaMensual.bind(this);
        this.getReporteCompleto = this.getReporteCompleto.bind(this);
        this.healthCheck = this.healthCheck.bind(this);
        this.getReportes = this.getReportes.bind(this);
        this.getReporteCSV = this.getReporteCSV.bind(this);
        this.testEmail = this.testEmail.bind(this);
    }

    _sendSuccessResponse(res, data, extras = {}) {
        res.json({
            success: true,
            data,
            ...extras,
            timestamp: new Date().toISOString()
        });
    }

    _sendErrorResponse(res, message, statusCode = 500, error = null) {
        console.error(`❌ ${message}:`, error?.message || '');
        if (error?.stack) console.error('❌ Stack trace:', error.stack);
        
        res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            timestamp: new Date().toISOString()
        });
    }

    _addNotificationInfo(emailNotification) {
        return emailNotification?.success ? {
            notification: {
                email_queued: true,
                background: emailNotification.background || false
            }
        } : {};
    }

    _getUserInfo(req) {
        return {
            ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Desconocida',
            userAgent: req.get('User-Agent') || 'Desconocido',
            method: req.method || 'GET',
            url: req.originalUrl || req.url || 'N/A',
            timestamp: new Date().toISOString()
        };
    }

    _getResponseTime(startTime) {
        return Date.now() - startTime;
    }

    _sendEmailNotification(reportData, userInfo) {
        if (!emailService) {
            console.log('📧 Servicio de email no disponible, saltando notificación');
            return { success: true, skipped: true, reason: 'Servicio no disponible' };
        }

        try {
            const emailPromise = emailService.sendReportNotification(reportData, userInfo);
            
            emailPromise.then(result => {
                if (result.success && !result.skipped) {
                    console.log('📧 Notificación enviada exitosamente:', result.messageId);
                } else if (result.skipped) {
                    console.log('📧 Notificación saltada:', result.reason);
                } else {
                    console.warn('⚠️  Error enviando notificación (no crítico):', result.error);
                }
            }).catch(error => {
                console.error('❌ Error en notificación por email (no crítico):', error.message);
            });

            return { success: true, background: true };
        } catch (error) {
            console.error('❌ Error configurando notificación (no crítico):', error.message);
            return { success: false, error: error.message, nonCritical: true };
        }
    }

    async _executeEndpoint(req, res, dataFetcher, reportDataBuilder) {
        const startTime = Date.now();
        const userInfo = this._getUserInfo(req);
        
        try {
            const data = await dataFetcher();
            const responseTime = this._getResponseTime(startTime);
            
            const reportData = reportDataBuilder(data, responseTime);
            
            const emailNotification = this._sendEmailNotification(reportData, userInfo);
            
            this._sendSuccessResponse(res, data, {
                ...this._addNotificationInfo(emailNotification),
                responseTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error procesando solicitud', 500, error);
        }
    }

    async getEstadisticasGenerales(req, res) {
        await this._executeEndpoint(
            req,
            res,
            async () => {
                const stats = await dbService.getEstadisticasGenerales();
                return {
                    total_quejas: stats.totalQuejas,
                    total_entidades: stats.totalEntidades,
                    quejas_hoy: stats.quejasHoy,
                    quejas_mes_actual: stats.quejasMes
                };
            },
            (data, responseTime) => ({
                tipo: 'Estadísticas Generales',
                totalRegistros: data.total_quejas,
                estadisticas: data,
                responseTime
            })
        );
    }

    async getQuejasPorEntidad(req, res) {
        await this._executeEndpoint(
            req,
            res,
            async () => await dbService.getQuejasPorEntidad(),
            (data, responseTime) => ({
                tipo: 'Distribución por Entidad',
                totalRegistros: data.length,
                responseTime
            })
        );
        
        if (res.statusCode === 200) {
            const originalJson = res.json;
            res.json = function(body) {
                if (body.success && body.data) {
                    body.count = body.data.length;
                }
                return originalJson.call(this, body);
            };
        }
    }

    async getTendenciaMensual(req, res) {
        const startTime = Date.now();
        const userInfo = this._getUserInfo(req);
        
        try {
            const limite = parseInt(req.query.limite) || 12;
            
            if (limite < 1 || limite > 24) {
                return this._sendErrorResponse(
                    res,
                    'El límite debe estar entre 1 y 24 meses',
                    400
                );
            }
            
            const tendencia = await dbService.getQuejasPorMes(limite);
            const responseTime = this._getResponseTime(startTime);
            
            const reportData = {
                tipo: 'Tendencia Mensual',
                totalRegistros: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                responseTime
            };
            
            const emailNotification = this._sendEmailNotification(reportData, userInfo);
            
            this._sendSuccessResponse(res, tendencia, {
                count: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                ...this._addNotificationInfo(emailNotification),
                responseTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo tendencia mensual', 500, error);
        }
    }

    async getReporteCompleto(req, res) {
        const startTime = Date.now();
        const userInfo = this._getUserInfo(req);
        
        try {
            const [estadisticasGenerales, distribucionEntidades, tendenciaMensual] = 
                await Promise.all([
                    dbService.getEstadisticasGenerales(),
                    dbService.getQuejasPorEntidad(),
                    dbService.getQuejasPorMes(12)
                ]);

            const responseTime = this._getResponseTime(startTime);

            const reportData = {
                tipo: 'Reporte Completo',
                totalRegistros: estadisticasGenerales.totalQuejas,
                estadisticas: {
                    total_quejas: estadisticasGenerales.totalQuejas,
                    total_entidades: estadisticasGenerales.totalEntidades,
                    quejas_hoy: estadisticasGenerales.quejasHoy,
                    quejas_mes_actual: estadisticasGenerales.quejasMes
                },
                responseTime
            };

            const emailNotification = this._sendEmailNotification(reportData, userInfo);

            this._sendSuccessResponse(res, {
                resumen: {
                    total_quejas: estadisticasGenerales.totalQuejas,
                    total_entidades: estadisticasGenerales.totalEntidades,
                    quejas_hoy: estadisticasGenerales.quejasHoy,
                    quejas_mes_actual: estadisticasGenerales.quejasMes
                },
                distribucion_por_entidad: distribucionEntidades,
                tendencia_mensual: tendenciaMensual
            }, {
                ...this._addNotificationInfo(emailNotification),
                generado_en: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error generando reporte completo', 500, error);
        }
    }

    async healthCheck(req, res) {
        const startTime = Date.now();
        
        try {
            const isHealthy = await dbService.healthCheck();
            const connectionInfo = await dbService.getConnectionInfo();
            const responseTime = this._getResponseTime(startTime);

            let emailStatus = 'not_configured';
            if (emailService) {
                try {
                    const emailHealthy = await emailService.verifyConnection();
                    emailStatus = emailHealthy ? 'healthy' : 'unhealthy';
                } catch (error) {
                    emailStatus = 'error';
                }
            }
            
            if (isHealthy) {
                res.json({
                    success: true,
                    status: 'healthy',
                    database: {
                        status: 'connected',
                        type: 'MySQL',
                        ...connectionInfo
                    },
                    email: {
                        status: emailStatus,
                        notifications_enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
                    },
                    server: {
                        uptime: Math.floor(process.uptime()),
                        memory: process.memoryUsage(),
                        version: process.version,
                        environment: process.env.NODE_ENV || 'development'
                    },
                    timestamp: new Date().toISOString(),
                    responseTime
                });
            } else {
                res.status(503).json({
                    success: false,
                    status: 'unhealthy',
                    message: 'Base de datos no disponible',
                    responseTime
                });
            }
        } catch (error) {
            res.status(503).json({
                success: false,
                status: 'error',
                message: 'Error en health check',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            });
        }
    }

    async getReportes(req, res) {
        const startTime = Date.now();
        const userInfo = this._getUserInfo(req);
        
        try {
            if (!dbService) {
                throw new Error('Servicio de base de datos no disponible');
            }
            
            const estadisticas = await dbService.getEstadisticasGenerales();
            const distribucion = await dbService.getQuejasPorEntidad();
            const responseTime = this._getResponseTime(startTime);

            const reportData = {
                tipo: 'Reportes Generales',
                totalRegistros: estadisticas?.totalQuejas || 0,
                estadisticas: {
                    total_quejas: estadisticas?.totalQuejas || 0,
                    total_entidades: estadisticas?.totalEntidades || 0,
                    quejas_hoy: estadisticas?.quejasHoy || 0,
                    quejas_mes_actual: estadisticas?.quejasMes || 0
                },
                responseTime
            };

            const emailNotification = this._sendEmailNotification(reportData, userInfo);
            
            this._sendSuccessResponse(res, {
                resumen: {
                    total_quejas: estadisticas?.totalQuejas || 0,
                    total_entidades: estadisticas?.totalEntidades || 0,
                    quejas_hoy: estadisticas?.quejasHoy || 0,
                    quejas_mes_actual: estadisticas?.quejasMes || 0
                },
                por_entidad: distribucion || []
            }, {
                ...this._addNotificationInfo(emailNotification),
                responseTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo reportes', 500, error);
        }
    }

    async getReporteCSV(req, res) {
        const startTime = Date.now();
        const userInfo = this._getUserInfo(req);
        
        try {
            const quejas = await dbService.getAllQuejas();
            const responseTime = this._getResponseTime(startTime);

            const reportData = {
                tipo: 'Reporte CSV',
                totalRegistros: quejas.length,
                formato: 'CSV',
                responseTime
            };

            this._sendEmailNotification(reportData, userInfo).catch(error => {
                console.error('❌ Error enviando notificación de CSV (no crítico):', error.message);
            });
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte_quejas.csv');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Report-Generated', new Date().toISOString());
            res.setHeader('X-Total-Records', quejas.length);
            
            const csvRows = ['ID,Entidad,Descripcion,Fecha_Creacion'];
            
            for (const queja of quejas) {
                const descripcion = (queja.descripcion || '')
                    .replace(/"/g, '""')
                    .replace(/\n/g, ' ');
                csvRows.push(
                    `${queja.id},"${queja.entidad_nombre || ''}","${descripcion}","${queja.fecha_creacion}"`
                );
            }
            
            res.send(csvRows.join('\n'));
        } catch (error) {
            this._sendErrorResponse(res, 'Error generando reporte CSV', 500, error);
        }
    }

    async testEmail(req, res) {
        try {
            if (!emailService) {
                return this._sendErrorResponse(
                    res,
                    'Servicio de email no disponible',
                    503
                );
            }

            const result = await emailService.sendTestEmail();
            
            this._sendSuccessResponse(res, {
                message: 'Test de email completado',
                result,
                email_service_available: true,
                notifications_enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error en test de email', 500, error);
        }
    }
}

module.exports = new EstadisticasController();