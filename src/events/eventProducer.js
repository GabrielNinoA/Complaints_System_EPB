const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

class EventProducer {
    constructor() {
        this.kafka = new Kafka({
            clientId: 'complaints-backend',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
        });

        this.producer = this.kafka.producer();
        this.isConnected = false;
    }

    async connect() {
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log('[KAFKA-PRODUCER] ✅ Conectado a Kafka');
            return true;
        } catch (error) {
            console.error('[KAFKA-PRODUCER] ❌ Error conectando a Kafka:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async publishEmailEvent(eventData, username = 'Sistema') {
        const traceId = uuidv4();
        const timestamp = new Date().toISOString();

        // Extraer estadísticas del reportData
        const reportStats = eventData.reportData?.estadisticas || eventData.reportData || {};

        const event = {
            traceId,
            eventType: 'REPORT_GENERATED',
            username,
            timestamp,
            action: 'Generación de reporte de quejas',
            reportData: {
                tipo: eventData.reportData?.tipo || 'Reportes Generales',
                total_quejas: reportStats.total_quejas || 0,
                total_entidades: reportStats.total_entidades || 0,
                quejas_hoy: reportStats.quejas_hoy || 0,
                quejas_mes_actual: reportStats.quejas_mes_actual || 0
            }
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`[KAFKA-PRODUCER] 📤 Publicando evento de email`);
        console.log(`[TraceID: ${traceId}]`);
        console.log(`[Event Type: ${event.eventType}]`);
        console.log(`[Username: ${username}]`);
        console.log(`[Timestamp: ${timestamp}]`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            if (!this.isConnected) {
                await this.connect();
            }

            await this.producer.send({
                topic: 'email.notifications',
                messages: [
                    {
                        key: traceId,
                        value: JSON.stringify(event),
                        timestamp: Date.now().toString()
                    }
                ]
            });

            console.log(`[KAFKA-PRODUCER] ✅ Evento publicado exitosamente [TraceID: ${traceId}]\n`);
            
            return { success: true, traceId };
        } catch (error) {
            console.error(`[KAFKA-PRODUCER] ❌ Error publicando evento [TraceID: ${traceId}]:`, error.message, '\n');
            return { success: false, traceId, error: error.message };
        }
    }

    // Alias para compatibilidad
    async publishReportGeneratedEvent(reportData, username = 'Sistema') {
        return this.publishEmailEvent(
            { 
                type: 'REPORT_GENERATED', 
                reportData: { estadisticas: reportData } 
            }, 
            username
        );
    }

    async disconnect() {
        if (this.isConnected) {
            try {
                await this.producer.disconnect();
                this.isConnected = false;
                console.log('[KAFKA-PRODUCER] 🔌 Desconectado de Kafka');
            } catch (error) {
                console.error('[KAFKA-PRODUCER] ❌ Error desconectando:', error.message);
            }
        }
    }
}

module.exports = new EventProducer();
