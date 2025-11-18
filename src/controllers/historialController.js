const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class HistorialController {
    constructor() {
        this.getAllHistorial = this.getAllHistorial.bind(this);
        this.getHistorialByEntity = this.getHistorialByEntity.bind(this);
        this.getHistorialStats = this.getHistorialStats.bind(this);
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
