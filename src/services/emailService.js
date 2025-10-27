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
                console.warn('⚠️  Configuración de email incompleta');
                this.initializationError = 'Variables de entorno faltantes';
                return;
            }

            console.log('🔧 Configurando transporte de email para Gmail...');
            
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                },
                connectionTimeout: 10000,
                greetingTimeout: 5000,
                socketTimeout: 10000,
                tls: {
                    rejectUnauthorized: true,
                    ciphers: 'SSLv3'
                }
            });

            this.isConfigured = true;
            console.log('✅ Transporte de email configurado');

            this.verifyConnection().then(success => {
                if (success) {
                    console.log('✅ Conexión con Gmail verificada exitosamente');
                } else {
                    console.warn('⚠️  No se pudo verificar la conexión con Gmail');
                }
            });

        } catch (error) {
            console.error('❌ Error configurando servicio de email:', error.message);
            this.isConfigured = false;
            this.initializationError = error.message;
        }
    }

    async verifyConnection() {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('❌ Error verificando conexión de email:', error.message);
            
            if (error.message.includes('Invalid login')) {
                console.error('🔐 Error de autenticación: Verifica la contraseña de aplicación');
            } else if (error.message.includes('ECONNREFUSED')) {
                console.error('🌐 Error de conexión: Verifica el host y puerto SMTP');
            } else if (error.message.includes('timeout')) {
                console.error('⏰ Timeout: Gmail no respondió a tiempo');
            }
            
            return false;
        }
    }

    async sendReportNotification(reportData, userInfo) {
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
            return { success: true, skipped: true, reason: 'Notificaciones deshabilitadas' };
        }

        if (!this.isConfigured || !this.transporter) {
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
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
                headers: {
                    'X-Priority': '3',
                    'X-Mailer': 'SistemaQuejasBoyaca'
                }
            };

            console.log('📧 Enviando notificación por email...');

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Email enviado exitosamente:', result.messageId);
            return { 
                success: true, 
                messageId: result.messageId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error enviando email:', error.message);
            
            if (error.message.includes('Invalid login')) {
                console.error('🔐 ERROR CRÍTICO: Contraseña de aplicación inválida');
                console.error('💡 SOLUCIÓN: Genera una nueva contraseña de aplicación en Google');
            } else if (error.message.includes('Message rejected')) {
                console.error('📭 Gmail rechazó el mensaje: Posible problema de autenticación o límite excedido');
            } else if (error.message.includes('Quota exceeded')) {
                console.error('📊 Límite de cuota excedido en Gmail');
            }
            
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
                    <div class="info-box">
                        <h3>📊 Información del Reporte</h3>
                        <p><strong>Tipo:</strong> ${reportData.tipo || 'Reporte General'}</p>
                        <p><strong>Fecha y Hora:</strong> ${timestamp}</p>
                        <p><strong>Total de Registros:</strong> ${reportData.totalRegistros || 'N/A'}</p>
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

${reportData.estadisticas ? `
ESTADÍSTICAS:
- Total de Quejas: ${reportData.estadisticas.total_quejas || 0}
- Total de Entidades: ${reportData.estadisticas.total_entidades || 0}
- Quejas Hoy: ${reportData.estadisticas.quejas_hoy || 0}
- Quejas Este Mes: ${reportData.estadisticas.quejas_mes_actual || 0}
` : ''}

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