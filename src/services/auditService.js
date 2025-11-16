const kafkaProducer = require('./kafkaProducer');

class AuditService {
    async logCreate(entidad, registroId, datos, metadata = {}) {
        try {
            const auditEvent = {
                tipoAccion: 'CREATE',
                entidadAfectada: entidad,
                registroId: registroId,
                datosAnteriores: null,
                datosNuevos: datos,
                usuario: metadata.usuario || 'sistema',
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null,
            };

            return await kafkaProducer.sendAuditEvent(auditEvent);
        } catch (error) {
            console.error('❌ Error registrando CREATE:', error.message);
            return { success: false, error: error.message };
        }
    }

    async logUpdate(entidad, registroId, datosAnteriores, datosNuevos, metadata = {}) {
        try {
            const auditEvent = {
                tipoAccion: 'UPDATE',
                entidadAfectada: entidad,
                registroId: registroId,
                datosAnteriores: datosAnteriores,
                datosNuevos: datosNuevos,
                usuario: metadata.usuario || 'sistema',
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null,
            };

            return await kafkaProducer.sendAuditEvent(auditEvent);
        } catch (error) {
            console.error('❌ Error registrando UPDATE:', error.message);
            return { success: false, error: error.message };
        }
    }

    async logDelete(entidad, registroId, datos, metadata = {}) {
        try {
            const auditEvent = {
                tipoAccion: 'DELETE',
                entidadAfectada: entidad,
                registroId: registroId,
                datosAnteriores: datos,
                datosNuevos: null,
                usuario: metadata.usuario || 'sistema',
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null,
            };

            return await kafkaProducer.sendAuditEvent(auditEvent);
        } catch (error) {
            console.error('❌ Error registrando DELETE:', error.message);
            return { success: false, error: error.message };
        }
    }

    async logRead(entidad, registroId, datos, metadata = {}) {
        try {
            const auditEvent = {
                tipoAccion: 'READ',
                entidadAfectada: entidad,
                registroId: registroId,
                datosAnteriores: null,
                datosNuevos: datos,
                usuario: metadata.usuario || 'sistema',
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null,
            };

            return await kafkaProducer.sendAuditEvent(auditEvent);
        } catch (error) {
            console.error('❌ Error registrando READ:', error.message);
            return { success: false, error: error.message };
        }
    }

    extractMetadata(req) {
        return {
            usuario: req.user?.username || req.body?.usuario || 'anonimo',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('user-agent') || null,
        };
    }

    getClientIP(req) {
        return (
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            null
        );
    }

    isReady() {
        return kafkaProducer.isProducerConnected();
    }
}

module.exports = new AuditService();
