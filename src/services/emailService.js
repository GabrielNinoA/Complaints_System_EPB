const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializationError = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                console.warn('⚠️  Configuración de email incompleta - funcionando sin notificaciones');
                this.initializationError = 'Variables de entorno faltantes';
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true', 
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                },
                connectionTimeout: 10000, 
                greetingTimeout: 5000,    
                socketTimeout: 15000,     
                tls: {
                    rejectUnauthorized: process.env.NODE_ENV === 'production'
                }
            });

            this.isConfigured = true;
            console.log('✅ Servicio de email configurado correctamente');
        } catch (error) {
            console.error('❌ Error configurando servicio de email:', error.message);
            this.isConfigured = false;
            this.initializationError = error.message;
        }
    }

    async verifyConnection() {
        if (!this.isConfigured) {
            return false;
        }

        try {
            const verificationPromise = this.transporter.verify();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            
            await Promise.race([verificationPromise, timeoutPromise]);
            return true;
        } catch (error) {
            console.error('❌ Error verificando conexión de email:', error.message);
            return false;
        }
    }

    async sendReportNotification(reportData, userInfo) {
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
            console.log('📧 Notificaciones por email deshabilitadas');
            return { success: true, skipped: true, reason: 'Notificaciones deshabilitadas' };
        }

        if (!this.isConfigured) {
            console.warn('⚠️  Email no configurado, saltando notificación');
            return { 
                success: true, 
                skipped: true, 
                reason: 'Email no configurado',
                error: this.initializationError 
            };
        }

        try {
            const emailContent = this.generateReportEmailContent(reportData, userInfo);
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
            };

            const sendPromise = this.transporter.sendMail(mailOptions);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email timeout')), 10000)
            );

            const result = await Promise.race([sendPromise, timeoutPromise]);
            
            console.log('📧 Email enviado exitosamente:', result.messageId);
            return { 
                success: true, 
                messageId: result.messageId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error enviando email (no crítico):', error.message);
            return { 
                success: false, 
                error: error.message,
                timestamp: new Date().toISOString(),
                nonCritical: true
            };
        }
    }

    generateReportEmailContent(reportData, userInfo) {
        const timestamp = new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const subject = `🔍 Reporte Generado - Sistema Quejas Boyacá - ${new Date().toLocaleDateString('es-CO')}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2c5aa0; }
                .stats-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .stats-table th, .stats-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
                .stats-table th { background-color: #2c5aa0; color: white; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔍 Reporte Generado</h1>
                    <p>Sistema de Quejas - Departamento de Boyacá</p>
                </div>
                
                <div class="content">
                    <div class="alert">
                        <strong>⚠️ ALERTA DE SEGURIDAD:</strong> Se ha generado un reporte en el sistema.
                    </div>

                    <div class="info-box">
                        <h3>📊 Información del Reporte</h3>
                        <p><strong>Tipo:</strong> ${reportData.tipo || 'Reporte General'}</p>
                        <p><strong>Fecha y Hora:</strong> ${timestamp}</p>
                        <p><strong>Total de Registros:</strong> ${reportData.totalRegistros || 'N/A'}</p>
                    </div>

                    <div class="info-box">
                        <h3>🌐 Información de Acceso</h3>
                        <p><strong>IP de Origen:</strong> ${userInfo.ip || 'Desconocida'}</p>
                        <p><strong>User Agent:</strong> ${userInfo.userAgent ? userInfo.userAgent.substring(0, 100) + '...' : 'Desconocido'}</p>
                        <p><strong>Método HTTP:</strong> ${userInfo.method || 'GET'}</p>
                        <p><strong>URL Solicitada:</strong> ${userInfo.url || 'N/A'}</p>
                    </div>

                    ${reportData.estadisticas ? `
                    <div class="info-box">
                        <h3>📈 Estadísticas del Reporte</h3>
                        <table class="stats-table">
                            <tr>
                                <th>Métrica</th>
                                <th>Valor</th>
                            </tr>
                            <tr>
                                <td>Total de Quejas</td>
                                <td>${reportData.estadisticas.total_quejas || 0}</td>
                            </tr>
                            <tr>
                                <td>Total de Entidades</td>
                                <td>${reportData.estadisticas.total_entidades || 0}</td>
                            </tr>
                            <tr>
                                <td>Quejas Hoy</td>
                                <td>${reportData.estadisticas.quejas_hoy || 0}</td>
                            </tr>
                            <tr>
                                <td>Quejas Este Mes</td>
                                <td>${reportData.estadisticas.quejas_mes_actual || 0}</td>
                            </tr>
                        </table>
                    </div>
                    ` : ''}

                    <div class="info-box">
                        <h3>⏱️ Información del Sistema</h3>
                        <p><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</p>
                        <p><strong>Versión:</strong> Sistema de Quejas Boyacá v2.0</p>
                        <p><strong>Tiempo de Respuesta:</strong> ${reportData.responseTime || 0}ms</p>
                    </div>

                    <div class="footer">
                        <p>Este es un mensaje automático del Sistema de Quejas del Departamento de Boyacá.</p>
                        <p>No responder a este correo electrónico.</p>
                        <p>Generado el ${timestamp}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const text = `
REPORTE GENERADO - Sistema de Quejas Boyacá

INFORMACIÓN DEL REPORTE:
- Tipo: ${reportData.tipo || 'Reporte General'}
- Fecha y Hora: ${timestamp}
- Total de Registros: ${reportData.totalRegistros || 'N/A'}

INFORMACIÓN DE ACCESO:
- IP de Origen: ${userInfo.ip || 'Desconocida'}
- User Agent: ${userInfo.userAgent || 'Desconocido'}
- Método HTTP: ${userInfo.method || 'GET'}
- URL: ${userInfo.url || 'N/A'}

${reportData.estadisticas ? `
ESTADÍSTICAS:
- Total de Quejas: ${reportData.estadisticas.total_quejas || 0}
- Total de Entidades: ${reportData.estadisticas.total_entidades || 0}
- Quejas Hoy: ${reportData.estadisticas.quejas_hoy || 0}
- Quejas Este Mes: ${reportData.estadisticas.quejas_mes_actual || 0}
` : ''}

SISTEMA:
- Servidor: ${process.env.NODE_ENV || 'development'}
- Tiempo de Respuesta: ${reportData.responseTime || 0}ms

---
Sistema de Quejas - Departamento de Boyacá
Generado automáticamente el ${timestamp}
        `;

        return { subject, html, text };
    }

    async sendTestEmail() {
        if (!this.isConfigured) {
            return { 
                success: false, 
                error: 'Email no configurado',
                details: this.initializationError
            };
        }

        try {
            const testData = {
                tipo: 'Email de Prueba',
                totalRegistros: 'N/A',
                responseTime: 50
            };

            const testUserInfo = {
                ip: '127.0.0.1',
                userAgent: 'Sistema de Prueba',
                method: 'TEST',
                url: '/api/test'
            };

            return await this.sendReportNotification(testData, testUserInfo);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();