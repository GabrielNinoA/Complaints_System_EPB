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

            console.log('🔧 Configurando transporte de email...');
            
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                },
                connectionTimeout: 30000, 
                greetingTimeout: 15000,   
                socketTimeout: 45000,   
                retryDelay: 5000,
                tls: {
                    rejectUnauthorized: false, 
                    ciphers: 'SSLv3'
                },
                pool: true,
                maxConnections: 3,
                maxMessages: 50
            });

            this.isConfigured = true;
            console.log('✅ Transporte de email configurado');

            setTimeout(() => {
                this.verifyConnection().then(success => {
                    if (success) {
                        console.log('✅ Conexión con Gmail verificada exitosamente');
                    } else {
                        console.warn('⚠️  No se pudo verificar la conexión con Gmail - Los emails se intentarán enviar de todas formas');
                    }
                });
            }, 2000);

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
            const verificationPromise = this.transporter.verify();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de verificación (20s)')), 20000)
            );
            
            await Promise.race([verificationPromise, timeoutPromise]);
            console.log('✅ Conexión de email verificada');
            return true;
        } catch (error) {
            console.error('❌ Error verificando conexión de email:', error.message);
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
                reason: 'Email no configurado'
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

            console.log('📧 Intentando enviar notificación por email...');

            let lastError = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`📧 Intento ${attempt} de 3...`);
                    
                    const sendPromise = this.transporter.sendMail(mailOptions);
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Timeout en intento ${attempt} (30s)`)), 30000)
                    );

                    const result = await Promise.race([sendPromise, timeoutPromise]);
                    
                    console.log(`✅ Email enviado exitosamente en intento ${attempt}:`, result.messageId);
                    return { 
                        success: true, 
                        messageId: result.messageId,
                        timestamp: new Date().toISOString(),
                        attempts: attempt
                    };

                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️  Intento ${attempt} fallido:`, error.message);
                    
                    if (attempt < 3) {
                        console.log(`⏳ Reintentando en 5 segundos...`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }

            throw lastError;

        } catch (error) {
            console.error('❌ Error enviando email después de 3 intentos:', error.message);
            
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
                        <p><strong>IP de Origen:</strong> ${userInfo.ip || 'Desconocida'}</p>
                    </div>

                    ${reportData.estadisticas ? `
                    <div class="info-box">
                        <h3>📈 Estadísticas</h3>
                        <table class="stats-table">
                            <tr><td>Total Quejas:</td><td>${reportData.estadisticas.total_quejas || 0}</td></tr>
                            <tr><td>Total Entidades:</td><td>${reportData.estadisticas.total_entidades || 0}</td></tr>
                            <tr><td>Quejas Hoy:</td><td>${reportData.estadisticas.quejas_hoy || 0}</td></tr>
                            <tr><td>Quejas Mes:</td><td>${reportData.estadisticas.quejas_mes_actual || 0}</td></tr>
                        </table>
                    </div>
                    ` : ''}

                    <div class="footer">
                        <p>Sistema de Quejas - Departamento de Boyacá</p>
                        <p>Generado el ${timestamp}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const text = `
REPORTE GENERADO - Sistema de Quejas Boyacá
Tipo: ${reportData.tipo || 'Reporte General'}
Fecha: ${timestamp}
Registros: ${reportData.totalRegistros || 'N/A'}
IP: ${userInfo.ip || 'Desconocida'}

${reportData.estadisticas ? `
ESTADÍSTICAS:
- Total Quejas: ${reportData.estadisticas.total_quejas || 0}
- Total Entidades: ${reportData.estadisticas.total_entidades || 0}
- Quejas Hoy: ${reportData.estadisticas.quejas_hoy || 0}
- Quejas Mes: ${reportData.estadisticas.quejas_mes_actual || 0}
` : ''}
        `;

        return { subject, html, text };
    }

    async sendTestEmail() {
        if (!this.isConfigured) {
            return { 
                success: false, 
                error: 'Email no configurado'
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