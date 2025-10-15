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

        this._getUserInfo = this._getUserInfo.bind(this);
        this._sendEmailNotification = this._sendEmailNotification.bind(this);
        this._formatNotification = this._formatNotification.bind(this);
        this._respondSuccess = this._respondSuccess.bind(this);
        this._respondError = this._respondError.bind(this);
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

    async _sendEmailNotification(reportData, userInfo) {
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

    _formatNotification(emailNotification) {
        if (emailNotification && emailNotification.success) {
            return {
                email_queued: true,
                background: emailNotification.background || false
            };
        }
        return null;
    }

    _respondSuccess(res, body, status = 200) {
        res.status(status).json(body);
    }

    _logError(error, context = '') {
        console.error(`❌ ${context}:`, error.message);
        if (error.stack && process.env.NODE_ENV === 'development') {
            console.error('Stack:', error.stack);
        }
    }

    _respondError(res, status = 500, message = 'Error', error = null, extra = {}) {
        this._logError(error, message);
        const payload = {
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' && error ? (error.message || error) : undefined,
            timestamp: new Date().toISOString(),
            ...extra
        };
        res.status(status).json(payload);
    }

    async getEstadisticasGenerales(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const estadisticas = await dbService.getEstadisticasGenerales();
            const responseTime = Date.now() - startTime;

            const reportData = {
                tipo: 'Estadísticas Generales',
                totalRegistros: estadisticas.totalQuejas,
                estadisticas: {
                    total_quejas: estadisticas.totalQuejas,
                    total_entidades: estadisticas.totalEntidades,
                    quejas_hoy: estadisticas.quejasHoy,
                    quejas_mes_actual: estadisticas.quejasMes
                },
                responseTime
            };

            const emailNotification = await this._sendEmailNotification(reportData, userInfo);

            this._respondSuccess(res, {
                success: true,
                data: {
                    total_quejas: estadisticas.totalQuejas,
                    total_entidades: estadisticas.totalEntidades,
                    quejas_hoy: estadisticas.quejasHoy,
                    quejas_mes_actual: estadisticas.quejasMes
                },
                notification: this._formatNotification(emailNotification),
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas generales:', error.message);
            this._respondError(res, 500, 'Error obteniendo estadísticas generales', error);
        }
    }

    async getQuejasPorEntidad(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const distribucion = await dbService.getQuejasPorEntidad();
            const responseTime = Date.now() - startTime;

            const reportData = {
                tipo: 'Distribución por Entidad',
                totalRegistros: distribucion.length,
                responseTime
            };

            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            this._respondSuccess(res, {
                success: true,
                data: distribucion,
                count: distribucion.length,
                notification: this._formatNotification(emailNotification),
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo distribución por entidad:', error.message);
            this._respondError(res, 500, 'Error obteniendo distribución por entidad', error);
        }
    }

    async getTendenciaMensual(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const limite = parseInt(req.query.limite) || 12;
            
            if (limite < 1 || limite > 24) {
                return this._respondError(res, 400, 'El límite debe estar entre 1 y 24 meses');
            }
            
            const tendencia = await dbService.getQuejasPorMes(limite);
            const responseTime = Date.now() - startTime;

            const reportData = {
                tipo: 'Tendencia Mensual',
                totalRegistros: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                responseTime
            };

            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            this._respondSuccess(res, {
                success: true,
                data: tendencia,
                count: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                notification: this._formatNotification(emailNotification),
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo tendencia mensual:', error.message);
            this._respondError(res, 500, 'Error obteniendo tendencia mensual', error);
        }
    }

    async getReporteCompleto(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const [estadisticasGenerales, distribucionEntidades, tendenciaMensual] = await Promise.all([
                dbService.getEstadisticasGenerales(),
                dbService.getQuejasPorEntidad(),
                dbService.getQuejasPorMes(12)
            ]);

            const responseTime = Date.now() - startTime;

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

            const emailNotification = await this._sendEmailNotification(reportData, userInfo);

            this._respondSuccess(res, {
                success: true,
                data: {
                    resumen: {
                        total_quejas: estadisticasGenerales.totalQuejas,
                        total_entidades: estadisticasGenerales.totalEntidades,
                        quejas_hoy: estadisticasGenerales.quejasHoy,
                        quejas_mes_actual: estadisticasGenerales.quejasMes
                    },
                    distribucion_por_entidad: distribucionEntidades,
                    tendencia_mensual: tendenciaMensual
                },
                notification: this._formatNotification(emailNotification),
                generado_en: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error generando reporte completo:', error.message);
            this._respondError(res, 500, 'Error generando reporte completo', error);
        }
    }

    async healthCheck(req, res) {
        try {
            const startTime = Date.now();
            
            const isHealthy = await dbService.healthCheck();
            const connectionInfo = await dbService.getConnectionInfo();
            
            const responseTime = Date.now() - startTime;

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
            console.error('❌ Health check error:', error.message);
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
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            if (!dbService) {
                throw new Error('Servicio de base de datos no disponible');
            }
            
            const estadisticas = await dbService.getEstadisticasGenerales();
            const distribucion = await dbService.getQuejasPorEntidad();
            const responseTime = Date.now() - startTime;

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

            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            this._respondSuccess(res, {
                success: true,
                data: {
                    resumen: {
                        total_quejas: estadisticas?.totalQuejas || 0,
                        total_entidades: estadisticas?.totalEntidades || 0,
                        quejas_hoy: estadisticas?.quejasHoy || 0,
                        quejas_mes_actual: estadisticas?.quejasMes || 0
                    },
                    por_entidad: distribucion || []
                },
                notification: this._formatNotification(emailNotification),
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo reportes:', error.message);
            this._respondError(res, 500, 'Error obteniendo reportes', error);
        }
    }

    async getReporteCSV(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const quejas = await dbService.getAllQuejas();
            const responseTime = Date.now() - startTime;

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
            
            let csvContent = 'ID,Entidad,Descripcion,Fecha_Creacion\n';
            
            for (const queja of quejas) {
                const descripcion = (queja.descripcion || '').replace(/"/g, '""').replace(/\n/g, ' ');
                csvContent += `${queja.id},"${queja.entidad_nombre || ''}","${descripcion}","${queja.fecha_creacion}"\n`;
            }
            
            res.send(csvContent);
        } catch (error) {
            console.error('❌ Error generando reporte CSV:', error.message);
            this._respondError(res, 500, 'Error generando reporte CSV', error);
        }
    }

    async testEmail(req, res) {
        try {
            if (!emailService) {
                return res.status(503).json({
                    success: false,
                    message: 'Servicio de email no disponible',
                    timestamp: new Date().toISOString()
                });
            }

            const result = await emailService.sendTestEmail();
            
            this._respondSuccess(res, {
                success: true,
                message: 'Test de email completado',
                result,
                email_service_available: !!emailService,
                notifications_enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error en test de email:', error.message);
            this._respondError(res, 500, 'Error en test de email', error);
        }
    }
}

module.exports = new EstadisticasController();