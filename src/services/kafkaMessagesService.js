const dbService = require('./database');

/**
 * Servicio para gestionar los mensajes de Kafka en la base de datos
 * Este servicio guarda los mensajes cuando se envían a Kafka (PENDIENTE)
 * y el History Consumer los marca como PROCESADO cuando los consume
 */
class KafkaMessagesService {
    /**
     * Guarda un mensaje que fue enviado a Kafka
     * @param {string} topic - Topic de Kafka
     * @param {Object} message - Mensaje que se envió
     * @param {Object} kafkaResult - Resultado de Kafka con partition y offset
     * @returns {Promise<Object>} Resultado de la inserción
     */
    async saveOutgoingMessage(topic, message, kafkaResult) {
        const query = `
            INSERT INTO kafka_mensajes_pendientes (
                topic,
                partition_number,
                offset_number,
                message_key,
                message_value,
                timestamp_kafka,
                estado,
                fecha_recepcion
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE', NOW())
            ON DUPLICATE KEY UPDATE
                message_value = VALUES(message_value),
                estado = 'PENDIENTE',
                intentos_procesamiento = intentos_procesamiento + 1
        `;

        // Kafka envía partition como número y offset como string
        // Convertimos a string ambos para que coincidan cuando el Consumer haga el UPDATE
        // El Consumer recibe estos valores directamente de Kafka y los usa como strings
        
        // Kafka puede devolver el offset en diferentes propiedades: offset, baseOffset, o logAppendTime
        const partition = String(kafkaResult.partition);
        const offset = String(kafkaResult.offset || kafkaResult.baseOffset || '0');
        
        // Validación: Si el offset sigue siendo undefined, no guardar
        if (offset === 'undefined' || !offset) {
            console.error(`❌ [KAFKA-PENDING] Offset inválido recibido de Kafka:`, kafkaResult);
            return {
                success: false,
                error: 'Offset indefinido recibido de Kafka',
            };
        }

        const params = [
            topic,
            partition,
            offset,
            message.key || null,
            message.value || JSON.stringify(message),
            Date.now(),
        ];

        try {
            const result = await dbService.execute(query, params);
            
            console.log(`💾 [KAFKA-PENDING] Mensaje guardado como PENDIENTE → Topic: ${topic} | Partition: ${partition} | Offset: ${offset}`);
            console.log(`   📊 Guardado como STRING: partition="${partition}", offset="${offset}"`);
            
            return {
                success: true,
                insertId: result.insertId,
            };
        } catch (error) {
            console.error(`❌ [KAFKA-PENDING] Error guardando mensaje:`, error.message);
            console.error(`   📋 Params usados:`, { topic, partition, offset });
            console.error(`   📋 kafkaResult original:`, kafkaResult);
            // No fallar el proceso principal si falla el guardado
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = new KafkaMessagesService();
