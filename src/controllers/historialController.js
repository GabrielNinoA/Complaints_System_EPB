const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class HistorialController {
    constructor() {
        this.getAllHistorial = this.getAllHistorial.bind(this);
        this.getHistorialByEntity = this.getHistorialByEntity.bind(this);
        this.getHistorialStats = this.getHistorialStats.bind(this);
        this.getKafkaStats = this.getKafkaStats.bind(this);
    }

    sendSuccessResponse(res, data, startTime, statusCode = 200, additionalFields = {}) {
        const response = {
            success: true,
            ...additionalFields,
            data,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
        };
        return res.status(statusCode).json(response);
    }

    sendErrorResponse(res, statusCode, message, error = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
        if (error && process.env.NODE_ENV === 'development') {
            response.error = error.message;
        }
        return res.status(statusCode).json(response);
    }

    async getAllHistorial(req, res) {
        try {
            const startTime = Date.now();
            
            const filters = this.buildFilters(req.query);
            const pagination = this.buildPagination(req.query);
            
            const query = this.buildHistorialQuery(filters, pagination);
            const countQuery = this.buildHistorialCountQuery(filters);
            
            console.log('🔍 [DEBUG] Query params:', {
                params: query.params,
                types: query.params.map(p => `${typeof p} (${p})`),
            });
            
            const [registros, totalCount] = await Promise.all([
                dbService.execute(query.sql, query.params),
                dbService.execute(countQuery.sql, countQuery.params),
            ]);

            const total = totalCount[0].total;
            const paginationInfo = {
                limit: pagination.limit,
                offset: pagination.offset,
                total: total,
                page: Math.floor(pagination.offset / pagination.limit) + 1,
                totalPages: Math.ceil(total / pagination.limit),
            };

            return this.sendSuccessResponse(
                res,
                registros,
                startTime,
                200,
                { 
                    pagination: paginationInfo,
                    filters: filters,
                }
            );

        } catch (error) {
            console.error('❌ Error obteniendo historial:', error.message);
            return this.sendErrorResponse(res, 500, 'Error obteniendo historial', error);
        }
    }

    async getHistorialByEntity(req, res) {
        try {
            const startTime = Date.now();
            
            const { entidad, id } = req.params;
            
            const validEntities = ['quejas', 'entidades', 'comentarios'];
            if (!validEntities.includes(entidad)) {
                return this.sendErrorResponse(res, 400, `Entidad inválida. Debe ser: ${validEntities.join(', ')}`);
            }

            const validation = QueryValidator.validateId(id);
            if (!validation.isValid) {
                return this.sendErrorResponse(res, 400, 'ID inválido', validation.errors);
            }

            const query = `
                SELECT * FROM historial_acciones
                WHERE entidad_afectada = ? AND registro_id = ?
                ORDER BY created_at DESC
            `;

            const registros = await dbService.execute(query, [entidad, validation.id]);

            return this.sendSuccessResponse(
                res,
                registros,
                startTime,
                200,
                {
                    entidad: entidad,
                    registroId: validation.id,
                    count: registros.length,
                }
            );

        } catch (error) {
            console.error('❌ Error obteniendo historial por entidad:', error.message);
            return this.sendErrorResponse(res, 500, 'Error obteniendo historial', error);
        }
    }

    async getHistorialStats(req, res) {
        try {
            const startTime = Date.now();
            
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

            const stats = {
                totalRegistros: total[0].count,
                porTipoAccion: porTipo,
                porEntidad: porEntidad,
                ultimosRegistros: ultimos,
            };

            return this.sendSuccessResponse(res, stats, startTime);

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
            return this.sendErrorResponse(res, 500, 'Error obteniendo estadísticas', error);
        }
    }

    async getKafkaStats(req, res) {
        try {
            const startTime = Date.now();
            
            const checkTableQuery = `
                SELECT COUNT(*) as table_exists 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'kafka_mensajes_pendientes'
            `;
            
            const tableCheck = await dbService.execute(checkTableQuery);
            
            if (!tableCheck[0].table_exists) {
                console.log('⚠️ Tabla kafka_mensajes_pendientes no existe');
                return this.sendSuccessResponse(res, {
                    total: 0,
                    pendientes: 0,
                    procesados: 0,
                    errores: 0,
                    primer_mensaje: null,
                    ultimo_mensaje: null,
                    tiempo_promedio_procesamiento: null,
                    pendientesRecientes: [],
                    erroresRecientes: [],
                    tableExists: false,
                }, startTime);
            }
            
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'PROCESADO' THEN 1 ELSE 0 END) as procesados,
                    SUM(CASE WHEN estado = 'ERROR' THEN 1 ELSE 0 END) as errores,
                    MIN(fecha_recepcion) as primer_mensaje,
                    MAX(fecha_recepcion) as ultimo_mensaje,
                    AVG(CASE 
                        WHEN estado = 'PROCESADO' AND fecha_procesamiento IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, fecha_recepcion, fecha_procesamiento) 
                        ELSE NULL 
                    END) as tiempo_promedio_procesamiento
                FROM kafka_mensajes_pendientes
            `;

            const result = await dbService.execute(query);
            const kafkaStats = result[0];

            console.log('📊 Kafka Stats Query Result:', kafkaStats);
            console.log('📊 Raw values:', {
                total: kafkaStats.total,
                pendientes: kafkaStats.pendientes,
                procesados: kafkaStats.procesados,
                errores: kafkaStats.errores,
                types: {
                    total: typeof kafkaStats.total,
                    pendientes: typeof kafkaStats.pendientes,
                    procesados: typeof kafkaStats.procesados,
                    errores: typeof kafkaStats.errores,
                }
            });

            const queriesRecientes = {
                pendientes: `
                    SELECT topic, partition_number, offset_number, fecha_recepcion 
                    FROM kafka_mensajes_pendientes 
                    WHERE estado = 'PENDIENTE' 
                    ORDER BY fecha_recepcion DESC 
                    LIMIT 5
                `,
                errores: `
                    SELECT topic, partition_number, offset_number, error_mensaje, fecha_recepcion 
                    FROM kafka_mensajes_pendientes 
                    WHERE estado = 'ERROR' 
                    ORDER BY fecha_recepcion DESC 
                    LIMIT 5
                `,
            };

            const [pendientesRecientes, erroresRecientes] = await Promise.all([
                dbService.execute(queriesRecientes.pendientes),
                dbService.execute(queriesRecientes.errores),
            ]);

            const stats = {
                total: Number(kafkaStats.total) || 0,
                pendientes: Number(kafkaStats.pendientes) || 0,
                procesados: Number(kafkaStats.procesados) || 0,
                errores: Number(kafkaStats.errores) || 0,
                primer_mensaje: kafkaStats.primer_mensaje,
                ultimo_mensaje: kafkaStats.ultimo_mensaje,
                tiempo_promedio_procesamiento: kafkaStats.tiempo_promedio_procesamiento 
                    ? parseFloat(kafkaStats.tiempo_promedio_procesamiento).toFixed(2) 
                    : null,
                pendientesRecientes: pendientesRecientes,
                erroresRecientes: erroresRecientes,
                tableExists: true,
            };

            console.log('✅ Kafka Stats Response:', stats);

            return this.sendSuccessResponse(res, stats, startTime);

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de Kafka:', error.message);
            console.error('Stack:', error.stack);
            return this.sendErrorResponse(res, 500, 'Error obteniendo estadísticas de Kafka', error);
        }
    }

    buildFilters(query) {
        const filters = {};
        
        if (query.tipoAccion) {
            filters.tipoAccion = query.tipoAccion.toUpperCase();
        }
        
        if (query.entidadAfectada) {
            filters.entidadAfectada = query.entidadAfectada.toLowerCase();
        }
        
        if (query.registroId) {
            filters.registroId = parseInt(query.registroId);
        }
        
        if (query.usuario) {
            filters.usuario = query.usuario;
        }
        
        if (query.fechaInicio) {
            filters.fechaInicio = query.fechaInicio;
        }
        
        if (query.fechaFin) {
            filters.fechaFin = query.fechaFin;
        }
        
        return filters;
    }

    buildPagination(query) {
        let limit = parseInt(query.limit, 10);
        let offset = parseInt(query.offset, 10);
        
        if (isNaN(limit) || limit < 1) limit = 50;
        if (limit > 200) limit = 200;
        if (isNaN(offset) || offset < 0) offset = 0;
        
        return { limit, offset };
    }

    buildHistorialQuery(filters, pagination) {
        let sql = 'SELECT * FROM historial_acciones WHERE 1=1';
        const params = [];

        if (filters.tipoAccion) {
            sql += ' AND tipo_accion = ?';
            params.push(filters.tipoAccion);
        }

        if (filters.entidadAfectada) {
            sql += ' AND entidad_afectada = ?';
            params.push(filters.entidadAfectada);
        }

        if (filters.registroId) {
            sql += ' AND registro_id = ?';
            params.push(filters.registroId);
        }

        if (filters.usuario) {
            sql += ' AND usuario LIKE ?';
            params.push(`%${filters.usuario}%`);
        }

        if (filters.fechaInicio) {
            sql += ' AND created_at >= ?';
            params.push(filters.fechaInicio);
        }

        if (filters.fechaFin) {
            sql += ' AND created_at <= ?';
            params.push(filters.fechaFin);
        }

        sql += ` ORDER BY id DESC LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;

        return { sql, params };
    }

    buildHistorialCountQuery(filters) {
        let sql = 'SELECT COUNT(*) as total FROM historial_acciones WHERE 1=1';
        const params = [];

        if (filters.tipoAccion) {
            sql += ' AND tipo_accion = ?';
            params.push(filters.tipoAccion);
        }

        if (filters.entidadAfectada) {
            sql += ' AND entidad_afectada = ?';
            params.push(filters.entidadAfectada);
        }

        if (filters.registroId) {
            sql += ' AND registro_id = ?';
            params.push(filters.registroId);
        }

        if (filters.usuario) {
            sql += ' AND usuario LIKE ?';
            params.push(`%${filters.usuario}%`);
        }

        if (filters.fechaInicio) {
            sql += ' AND created_at >= ?';
            params.push(filters.fechaInicio);
        }

        if (filters.fechaFin) {
            sql += ' AND created_at <= ?';
            params.push(filters.fechaFin);
        }

        return { sql, params };
    }
}

module.exports = new HistorialController();
