const { Kafka, logLevel } = require('kafkajs');

class KafkaConfig {
    constructor() {
        this.kafka = new Kafka({
            clientId: process.env.KAFKA_CLIENT_ID || 'complaints-system-epb',
            brokers: this.getBrokers(),
            logLevel: this.getLogLevel(),
            retry: {
                initialRetryTime: 100,
                retries: 8,
                maxRetryTime: 30000,
                multiplier: 2,
            },
            connectionTimeout: 10000,
            requestTimeout: 30000,
        });

        this.topics = {
            AUDIT: process.env.KAFKA_TOPIC_AUDIT || 'audit-events',
        };
    }

    /**
     * Obtiene la lista de brokers desde las variables de entorno
     * @returns {string[]} Lista de brokers
     */
    getBrokers() {
        const brokersList = process.env.KAFKA_BROKERS || 'localhost:9092';
        return brokersList.split(',').map(broker => broker.trim());
    }

    /**
     * Obtiene el nivel de logging según el entorno
     * @returns {number} Nivel de logging de KafkaJS
     */
    getLogLevel() {
        if (process.env.NODE_ENV === 'production') {
            return logLevel.ERROR;
        }
        return logLevel.INFO;
    }

    /**
     * Retorna la instancia de Kafka
     * @returns {Kafka} Instancia de Kafka
     */
    getKafka() {
        return this.kafka;
    }

    /**
     * Retorna los topics configurados
     * @returns {Object} Objeto con los topics
     */
    getTopics() {
        return this.topics;
    }

    /**
     * Crea el producer de Kafka
     * @returns {Producer} Instancia del producer
     */
    createProducer() {
        return this.kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
        });
    }

    /**
     * Crea el consumer de Kafka
     * @param {string} groupId - ID del grupo de consumidores
     * @returns {Consumer} Instancia del consumer
     */
    createConsumer(groupId) {
        return this.kafka.consumer({
            groupId: groupId || process.env.KAFKA_CONSUMER_GROUP || 'audit-consumer-group',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });
    }

    /**
     * Crea el admin de Kafka para gestionar topics
     * @returns {Admin} Instancia del admin
     */
    createAdmin() {
        return this.kafka.admin();
    }

    /**
     * Prueba la conexión con Kafka
     * @returns {Promise<boolean>} true si la conexión es exitosa
     */
    async testConnection() {
        try {
            const admin = this.createAdmin();
            await admin.connect();
            await admin.listTopics();
            await admin.disconnect();
            console.log('✅ Conexión a Kafka exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a Kafka:', error.message);
            return false;
        }
    }

    /**
     * Crea los topics necesarios si no existen
     * @returns {Promise<void>}
     */
    async createTopics() {
        const admin = this.createAdmin();
        try {
            await admin.connect();
            
            const existingTopics = await admin.listTopics();
            const topicsToCreate = [];

            if (!existingTopics.includes(this.topics.AUDIT)) {
                topicsToCreate.push({
                    topic: this.topics.AUDIT,
                    numPartitions: 3,
                    replicationFactor: 1,
                });
            }

            if (topicsToCreate.length > 0) {
                await admin.createTopics({
                    topics: topicsToCreate,
                });
                console.log('✅ Topics creados:', topicsToCreate.map(t => t.topic).join(', '));
            } else {
                console.log('ℹ️  Todos los topics ya existen');
            }

        } catch (error) {
            console.error('❌ Error creando topics:', error.message);
        } finally {
            await admin.disconnect();
        }
    }
}

module.exports = new KafkaConfig();
