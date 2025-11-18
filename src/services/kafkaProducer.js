const kafkaConfig = require('../config/kafka');

class KafkaProducerService {
    constructor() {
        this.producer = null;
        this.isConnected = false;
        this.topics = kafkaConfig.getTopics();
    }

    /**
     * Conecta el producer a Kafka
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.isConnected) {
            console.log('ℹ️  Producer ya está conectado');
            return;
        }

        try {
            this.producer = kafkaConfig.createProducer();
            await this.producer.connect();
            this.isConnected = true;
            console.log('✅ Kafka Producer conectado exitosamente');
        } catch (error) {
            console.error('❌ Error conectando Kafka Producer:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Desconecta el producer de Kafka
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this.isConnected || !this.producer) {
            return;
        }

        try {
            await this.producer.disconnect();
            this.isConnected = false;
            console.log('✅ Kafka Producer desconectado');
        } catch (error) {
            console.error('❌ Error desconectando Kafka Producer:', error.message);
        }
    }

    /**
     * Envía un evento de auditoría a Kafka
     * @param {Object} auditEvent - Evento de auditoría a enviar
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendAuditEvent(auditEvent) {
        if (!this.isConnected) {
            console.warn('⚠️  Producer no conectado. Intentando reconectar...');
            await this.connect();
        }

        try {
            this.validateAuditEvent(auditEvent);

            const message = {
                key: `${auditEvent.entidadAfectada}-${auditEvent.registroId}`,
                value: JSON.stringify({
                    ...auditEvent,
                    timestamp: new Date().toISOString(),
                }),
                headers: {
                    source: 'complaints-system-epb',
                    version: '1.0',
                },
            };

            const result = await this.producer.send({
                topic: this.topics.AUDIT,
                messages: [message],
            });

            console.log(`📤 [AUDIT] ${auditEvent.tipoAccion} → ${auditEvent.entidadAfectada}#${auditEvent.registroId} enviado a Kafka`);
            
            return {
                success: true,
                topic: this.topics.AUDIT,
                partition: result[0].partition,
                offset: result[0].offset,
            };

        } catch (error) {
            console.error('❌ Error enviando evento de auditoría:', error.message);
            throw error;
        }
    }

    /**
     * Envía múltiples eventos de auditoría en batch
     * @param {Array} auditEvents - Array de eventos de auditoría
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendAuditEventsBatch(auditEvents) {
        if (!this.isConnected) {
            console.warn('⚠️  Producer no conectado. Intentando reconectar...');
            await this.connect();
        }

        try {
            auditEvents.forEach(event => this.validateAuditEvent(event));

            const messages = auditEvents.map(event => ({
                key: `${event.entidadAfectada}-${event.registroId}`,
                value: JSON.stringify({
                    ...event,
                    timestamp: new Date().toISOString(),
                }),
                headers: {
                    source: 'complaints-system-epb',
                    version: '1.0',
                },
            }));

            const result = await this.producer.send({
                topic: this.topics.AUDIT,
                messages: messages,
            });

            console.log(`📤 [AUDIT] Batch de ${auditEvents.length} eventos enviados a Kafka`);
            
            return {
                success: true,
                topic: this.topics.AUDIT,
                count: auditEvents.length,
                results: result,
            };

        } catch (error) {
            console.error('❌ Error enviando eventos de auditoría en batch:', error.message);
            throw error;
        }
    }

    /**
     * Valida que un evento de auditoría tenga los campos requeridos
     * @param {Object} auditEvent - Evento a validar
     * @throws {Error} Si el evento es inválido
     */
    validateAuditEvent(auditEvent) {
        const requiredFields = ['tipoAccion', 'entidadAfectada', 'registroId'];
        const validActions = ['CREATE', 'UPDATE', 'DELETE', 'READ'];
        const validEntities = ['quejas', 'entidades', 'comentarios'];

        for (const field of requiredFields) {
            if (!auditEvent[field]) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }

        if (!validActions.includes(auditEvent.tipoAccion)) {
            throw new Error(`Tipo de acción inválido: ${auditEvent.tipoAccion}. Debe ser: ${validActions.join(', ')}`);
        }

        if (!validEntities.includes(auditEvent.entidadAfectada)) {
            throw new Error(`Entidad afectada inválida: ${auditEvent.entidadAfectada}. Debe ser: ${validEntities.join(', ')}`);
        }

        if (typeof auditEvent.registroId !== 'number' || auditEvent.registroId <= 0) {
            throw new Error('registroId debe ser un número positivo');
        }
    }

    /**
     * Verifica si el producer está conectado
     * @returns {boolean} Estado de conexión
     */
    isProducerConnected() {
        return this.isConnected;
    }
}

module.exports = new KafkaProducerService();
