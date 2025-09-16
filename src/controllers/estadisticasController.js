const dbService = require('../services/database');
const emailService = require('../services/email');

class EstadisticasController {
    // Función auxiliar para obtener información del usuario
    _getUserInfo(req) {
        return {
            ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Desconocida',
            userAgent: req.get('User-Agent') || 'Desconocido',
            method: req.method || 'GET',
            url: req.originalUrl || req.url || 'N/A',
            timestamp: new Date().toISOString()
        };
    }

    // Función auxiliar para enviar notificación por email
    async _sendEmailNotification(reportData, userInfo) {
        try {
            if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
                const emailResult = await emailService.sendReportNotification(reportData, userInfo);
                if (emailResult.success) {
                    console.log('📧 Notificación enviada exitosamente:', emailResult.messageId);
                } else {
                    console.warn('⚠️  Error enviando notificación:', emailResult.error);
                }
                return emailResult;
            }
        } catch (error) {
            console.error('❌ Error en notificación por email:', error.message);
        }
        return null;
    }

    // Obtener estadísticas generales del sistema
    async getEstadisticasGenerales(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const estadisticas = await dbService.getEstadisticasGenerales();
            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
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

            // Enviar notificación por email
            const emailNotification = await this._sendEmailNotification(reportData, userInfo);

            res.json({
                success: true,
                data: {
                    total_quejas: estadisticas.totalQuejas,
                    total_entidades: estadisticas.totalEntidades,
                    quejas_hoy: estadisticas.quejasHoy,
                    quejas_mes_actual: estadisticas.quejasMes
                },
                notification: emailNotification ? {
                    email_sent: emailNotification.success,
                    email_id: emailNotification.messageId || null
                } : null,
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas generales:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas generales',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener distribución de quejas por entidad
    async getQuejasPorEntidad(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const distribucion = await dbService.getQuejasPorEntidad();
            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
            const reportData = {
                tipo: 'Distribución por Entidad',
                totalRegistros: distribucion.length,
                responseTime
            };

            // Enviar notificación por email
            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            res.json({
                success: true,
                data: distribucion,
                count: distribucion.length,
                notification: emailNotification ? {
                    email_sent: emailNotification.success,
                    email_id: emailNotification.messageId || null
                } : null,
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo distribución por entidad:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo distribución por entidad',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener tendencia mensual de quejas
    async getTendenciaMensual(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            // Obtener parámetro de límite (por defecto 12 meses)
            const limite = parseInt(req.query.limite) || 12;
            
            if (limite < 1 || limite > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'El límite debe estar entre 1 y 24 meses'
                });
            }
            
            const tendencia = await dbService.getQuejasPorMes(limite);
            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
            const reportData = {
                tipo: 'Tendencia Mensual',
                totalRegistros: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                responseTime
            };

            // Enviar notificación por email
            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            res.json({
                success: true,
                data: tendencia,
                count: tendencia.length,
                periodo: `Últimos ${limite} meses`,
                notification: emailNotification ? {
                    email_sent: emailNotification.success,
                    email_id: emailNotification.messageId || null
                } : null,
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo tendencia mensual:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo tendencia mensual',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener reporte completo
    async getReporteCompleto(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            // Ejecutar todas las consultas en paralelo
            const [estadisticasGenerales, distribucionEntidades, tendenciaMensual] = await Promise.all([
                dbService.getEstadisticasGenerales(),
                dbService.getQuejasPorEntidad(),
                dbService.getQuejasPorMes(12)
            ]);

            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
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

            // Enviar notificación por email
            const emailNotification = await this._sendEmailNotification(reportData, userInfo);

            res.json({
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
                notification: emailNotification ? {
                    email_sent: emailNotification.success,
                    email_id: emailNotification.messageId || null
                } : null,
                generado_en: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error generando reporte completo:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error generando reporte completo',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Health check de la base de datos
    async healthCheck(req, res) {
        try {
            const startTime = Date.now();
            
            // Verificar conexión a base de datos
            const isHealthy = await dbService.healthCheck();
            const connectionInfo = await dbService.getConnectionInfo();
            
            const responseTime = Date.now() - startTime;
            
            if (isHealthy) {
                res.json({
                    success: true,
                    status: 'healthy',
                    database: {
                        status: 'connected',
                        type: 'MySQL',
                        ...connectionInfo
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
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener reportes generales (compatibilidad con API original)
    async getReportes(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const estadisticas = await dbService.getEstadisticasGenerales();
            const distribucion = await dbService.getQuejasPorEntidad();
            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
            const reportData = {
                tipo: 'Reportes Generales',
                totalRegistros: estadisticas.totalQuejas,
                estadisticas: {
                    total_quejas: estadisticas.totalQuejas,
                    total_entidades: estadisticas.totalEntidades,
                    quejas_hoy: estadisticas.quejasHoy,
                    quejas_mes_actual: estadisticas.quejasMes
                },
                responseTime
            };

            // Enviar notificación por email
            const emailNotification = await this._sendEmailNotification(reportData, userInfo);
            
            res.json({
                success: true,
                data: {
                    resumen: {
                        total_quejas: estadisticas.totalQuejas,
                        total_entidades: estadisticas.totalEntidades,
                        quejas_hoy: estadisticas.quejasHoy,
                        quejas_mes_actual: estadisticas.quejasMes
                    },
                    por_entidad: distribucion
                },
                notification: emailNotification ? {
                    email_sent: emailNotification.success,
                    email_id: emailNotification.messageId || null
                } : null,
                timestamp: new Date().toISOString(),
                responseTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo reportes:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo reportes',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener reporte en formato CSV
    async getReporteCSV(req, res) {
        try {
            const startTime = Date.now();
            const userInfo = this._getUserInfo(req);
            
            const quejas = await dbService.getAllQuejas();
            const responseTime = Date.now() - startTime;

            // Preparar datos del reporte para email
            const reportData = {
                tipo: 'Reporte CSV',
                totalRegistros: quejas.length,
                formato: 'CSV',
                responseTime
            };

            // Enviar notificación por email (en background, no esperar respuesta)
            this._sendEmailNotification(reportData, userInfo).catch(error => {
                console.error('❌ Error enviando notificación de CSV:', error.message);
            });
            
            // Configurar headers para descarga CSV
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte_quejas.csv');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Report-Generated', new Date().toISOString());
            res.setHeader('X-Total-Records', quejas.length);
            
            // Encabezados CSV
            let csvContent = 'ID,Entidad,Descripcion,Fecha_Creacion\n';
            
            // Agregar datos
            for (const queja of quejas) {
                const descripcion = queja.descripcion.replace(/"/g, '""').replace(/\n/g, ' ');
                csvContent += `${queja.id},"${queja.entidad_nombre}","${descripcion}","${queja.fecha_creacion}"\n`;
            }
            
            res.send(csvContent);
        } catch (error) {
            console.error('❌ Error generando reporte CSV:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error generando reporte CSV',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Endpoint para probar el servicio de email
    async testEmail(req, res) {
        try {
            const result = await emailService.sendTestEmail();
            
            res.json({
                success: true,
                message: 'Test de email completado',
                result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error en test de email:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error en test de email',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new EstadisticasController();