const kafkaConfig = require('../config/kafka');
const dbService = require('./database');

class KafkaConsumerService {
    constructor() {
        this.consumer = null;
        this.isConnected = false;
        this.isRunning = false;
        this.topics = kafkaConfig.getTopics();
        this.recordsProcessed = 0;
        this.recordsFailed = 0;
    }

    async connect() {
        if (this.isConnected) {
            console.log('ℹ️  Consumer ya está conectado');
            return;
        }

        try {
            this.consumer = kafkaConfig.createConsumer();
            await this.consumer.connect();
            this.isConnected = true;
            console.log('✅ Kafka Consumer conectado exitosamente');
        } catch (error) {
            console.error('❌ Error conectando Kafka Consumer:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected || !this.consumer) {
            return;
        }

        try {
            this.isRunning = false;
            await this.consumer.disconnect();
            this.isConnected = false;
            console.log('✅ Kafka Consumer desconectado');
            console.log(`📊 Estadísticas: ${this.recordsProcessed} registros procesados, ${this.recordsFailed} fallidos`);
        } catch (error) {
            console.error('❌ Error desconectando Kafka Consumer:', error.message);
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('ℹ️  Consumer ya está ejecutándose');
            return;
        }

        if (!this.isConnected) {
            await this.connect();
        }

        try {
            await this.consumer.subscribe({
                topic: this.topics.AUDIT,
                fromBeginning: false,
            });

            this.isRunning = true;
            console.log(`✅ Consumer escuchando en el topic: ${this.topics.AUDIT}`);

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    await this.processMessage(topic, partition, message);
                },
            });

        } catch (error) {
            console.error('❌ Error iniciando Kafka Consumer:', error.message);
            this.isRunning = false;
            throw error;
        }
    }

    async processMessage(topic, partition, message) {
        try {
            const auditEvent = JSON.parse(message.value.toString());
            
            await this.saveToDatabase(auditEvent, partition, message.offset);

            this.recordsProcessed++;
            
            if (this.recordsProcessed % 10 === 0) {
                console.log(`📊 [CONSUMER] Total procesado: ${this.recordsProcessed} registros`);
            }

        } catch (error) {
            this.recordsFailed++;
            console.error(`❌ [CONSUMER] Error procesando mensaje:`, error.message);
            if (process.env.NODE_ENV === 'development') {
                console.error('Mensaje:', message.value.toString());
            }
        }
    }

    async saveToDatabase(auditEvent, partition, offset) {
        const query = `
            INSERT INTO historial_acciones (
                tipo_accion,
                entidad_afectada,
                registro_id,
                datos_anteriores,
                datos_nuevos,
                usuario,
                ip_address,
                user_agent,
                kafka_offset,
                kafka_partition
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            auditEvent.tipoAccion,
            auditEvent.entidadAfectada,
            auditEvent.registroId,
            auditEvent.datosAnteriores ? JSON.stringify(auditEvent.datosAnteriores) : null,
            auditEvent.datosNuevos ? JSON.stringify(auditEvent.datosNuevos) : null,
            auditEvent.usuario || 'sistema',
            auditEvent.ipAddress || null,
            auditEvent.userAgent || null,
            offset,
            partition,
        ];

        try {
            const result = await dbService.execute(query, params);
            
            console.log(`📊 [HISTORIAL] Registro guardado → ID: ${result.insertId} | Acción: ${auditEvent.tipoAccion} | Entidad: ${auditEvent.entidadAfectada} | Registro: ${auditEvent.registroId}`);
            
            return {
                success: true,
                insertId: result.insertId,
            };

        } catch (error) {
            console.error(`❌ [HISTORIAL] Error guardando en BD:`, error.message);
            throw error;
        }
    }

    getStats() {
        return {
            isConnected: this.isConnected,
            isRunning: this.isRunning,
            recordsProcessed: this.recordsProcessed,
            recordsFailed: this.recordsFailed,
            successRate: this.recordsProcessed > 0 
                ? ((this.recordsProcessed / (this.recordsProcessed + this.recordsFailed)) * 100).toFixed(2) + '%'
                : '0%',
        };
    }

    async getTotalRecords() {
        try {
            const query = 'SELECT COUNT(*) as total FROM historial_acciones';
            const result = await dbService.execute(query);
            return result[0].total;
        } catch (error) {
            console.error('❌ [CONSUMER] Error obteniendo total de registros:', error.message);
            return 0;
        }
    }

    async getDatabaseStats() {
        try {
            const queries = {
                total: 'SELECT COUNT(*) as count FROM historial_acciones',
                porTipo: `
                    SELECT tipo_accion, COUNT(*) as count 
                    FROM historial_acciones 
                    GROUP BY tipo_accion
                `,
                porEntidad: `
                    SELECT entidad_afectada, COUNT(*) as count 
                    FROM historial_acciones 
                    GROUP BY entidad_afectada
                `,
                ultimos: `
                    SELECT * FROM historial_acciones 
                    ORDER BY created_at DESC 
                    LIMIT 5
                `,
            };

            const [total, porTipo, porEntidad, ultimos] = await Promise.all([
                dbService.execute(queries.total),
                dbService.execute(queries.porTipo),
                dbService.execute(queries.porEntidad),
                dbService.execute(queries.ultimos),
            ]);

            return {
                totalRegistros: total[0].count,
                porTipoAccion: porTipo,
                porEntidad: porEntidad,
                ultimosRegistros: ultimos,
            };

        } catch (error) {
            console.error('❌ [CONSUMER] Error obteniendo estadísticas de BD:', error.message);
            throw error;
        }
    }
}

module.exports = new KafkaConsumerService();
