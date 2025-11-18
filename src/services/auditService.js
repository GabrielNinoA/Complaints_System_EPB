const kafkaProducer = require('./kafkaProducer');

class AuditService {
    /**
     * Registra la creación de un registro
     * @param {string} entidad - Nombre de la entidad ('quejas', 'entidades', 'comentarios')
     * @param {number} registroId - ID del registro creado
     * @param {Object} datos - Datos del nuevo registro
     * @param {Object} metadata - Información adicional (usuario, IP, user agent)
     * @returns {Promise<Object>} Resultado del envío
     */
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

    /**
     * Registra la actualización de un registro
     * @param {string} entidad - Nombre de la entidad
     * @param {number} registroId - ID del registro actualizado
     * @param {Object} datosAnteriores - Datos antes de la actualización
     * @param {Object} datosNuevos - Datos después de la actualización
     * @param {Object} metadata - Información adicional
     * @returns {Promise<Object>} Resultado del envío
     */
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

    /**
     * Registra la eliminación de un registro
     * @param {string} entidad - Nombre de la entidad
     * @param {number} registroId - ID del registro eliminado
     * @param {Object} datos - Datos del registro antes de eliminarse
     * @param {Object} metadata - Información adicional
     * @returns {Promise<Object>} Resultado del envío
     */
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

    /**
     * Registra la lectura de un registro (opcional)
     * @param {string} entidad - Nombre de la entidad
     * @param {number} registroId - ID del registro leído
     * @param {Object} datos - Datos del registro
     * @param {Object} metadata - Información adicional
     * @returns {Promise<Object>} Resultado del envío
     */
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

    /**
     * Extrae metadata del request (usuario, IP, user agent)
     * @param {Object} req - Request de Express
     * @returns {Object} Metadata extraída
     */
    extractMetadata(req) {
        return {
            usuario: req.user?.username || req.body?.usuario || 'anonimo',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('user-agent') || null,
        };
    }

    /**
     * Obtiene la IP del cliente desde el request
     * @param {Object} req - Request de Express
     * @returns {string|null} IP del cliente
     */
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

    /**
     * Verifica si el servicio de auditoría está listo
     * @returns {boolean} Estado del producer
     */
    isReady() {
        return kafkaProducer.isProducerConnected();
    }
}

module.exports = new AuditService();
