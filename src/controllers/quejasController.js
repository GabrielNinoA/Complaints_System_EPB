const dbService = require('../services/database');
const { QuejaValidator, QueryValidator } = require('../validators');

class QuejasController {
    constructor() {
        // Bind de métodos
        this.getAllQuejas = this.getAllQuejas.bind(this);
        this.getQuejaById = this.getQuejaById.bind(this);
        this.createQueja = this.createQueja.bind(this);
        this.getQuejasByEntidad = this.getQuejasByEntidad.bind(this);
        this.deleteQueja = this.deleteQueja.bind(this);
        this.updateQuejaStatus = this.updateQuejaStatus.bind(this);
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

    sendValidationErrorResponse(res, message, errors = []) {
        return res.status(400).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        });
    }

    logError(operation, error) {
        console.error(`❌ Error ${operation}:`, error.message);
        if (error?.stack && process.env.NODE_ENV === 'development') {
            console.error('Stack trace:', error.stack);
        }
    }

    validateId(id) {
        return QueryValidator.validateId(id);
    }

    // Obtener todas las quejas con paginación
    async getAllQuejas(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = this.validatePagination(req.query);
            if (!validation.isValid) {
                return this.sendValidationErrorResponse(res, 'Parámetros de paginación inválidos', validation.errors);
            }

            let { limit, offset } = validation.params;

            const [quejas, totalCount] = await this.fetchQuejasAndCount(limit, offset);
            const pagination = this.buildPaginationObject(totalCount, limit, offset);
            return this.sendSuccessResponse(res, quejas, startTime, 200, { pagination });
            
        } catch (error) {
            this.logError('obteniendo todas las quejas', error);
            return this.sendErrorResponse(res, 500, 'Error obteniendo quejas', error);
        }
    }

    // Obtener queja por ID
    async getQuejaById(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = this.validateId(req.params.id);
            if (!validation.isValid) {
                return this.sendValidationErrorResponse(res, 'ID inválido', validation.errors);
            }

            const queja = await dbService.getQuejaById(validation.id);
            
            if (!queja) {
                return this.sendErrorResponse(res, 404, 'Queja no encontrada');
            }

            return this.sendSuccessResponse(res, queja, startTime);

        } catch (error) {
            this.logError('obteniendo queja por ID', error);
            return this.sendErrorResponse(res, 500, 'Error obteniendo la queja', error);
        }
    }

    // Crear nueva queja
    async createQueja(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QuejaValidator.validate(req.body);
            if (!validation.isValid) {
                return this.sendValidationErrorResponse(res, 'Datos de queja inválidos', validation.errors);
            }

            const quejaData = QuejaValidator.sanitize(req.body);
            
            const entidad = await this.getAndEnsureEntidadExists(quejaData.entidad_id);
            if (!entidad) {
                return this.sendErrorResponse(res, 404, 'Entidad no encontrada');
            }

            const nuevaQueja = await dbService.createQueja(quejaData);
            const responseData = this.buildCreateQuejaResponse(nuevaQueja, quejaData, entidad);

            return this.sendSuccessResponse(res, responseData, startTime, 201, { message: 'Queja creada exitosamente' });
        } catch (error) {
            this.logError('creando queja', error);
            return this.sendErrorResponse(res, 500, 'Error creando la queja', error);
        }
    }

    // Obtener quejas por entidad
    async getQuejasByEntidad(req, res) {
        try {
            const startTime = Date.now();
            
            const idValidation = this.validateId(req.params.entidadId);
            if (!idValidation.isValid) {
                return this.sendValidationErrorResponse(res, 'ID de entidad inválido', idValidation.errors);
            }

            const paginationValidation = this.validatePagination(req.query);
            if (!paginationValidation.isValid) {
                return this.sendValidationErrorResponse(res, 'Parámetros de paginación inválidos', paginationValidation.errors);
            }

            const entidad = await this.getAndEnsureEntidadExists(idValidation.id);
            if (!entidad) {
                return this.sendErrorResponse(res, 404, 'Entidad no encontrada');
            }

            const { limit, offset } = paginationValidation.params;
            const [quejas, totalCount] = await this.fetchQuejasByEntidadAndCount(entidad.id, limit, offset);
            const pagination = this.buildPaginationObject(totalCount, limit, offset);

            return this.sendSuccessResponse(res, quejas, startTime, 200, {
                entidad: { id: entidad.id, nombre: entidad.nombre },
                pagination
            });
        } catch (error) {
            this.logError('obteniendo quejas por entidad', error);
            return this.sendErrorResponse(res, 500, 'Error obteniendo quejas por entidad', error);
        }
    }

    // Eliminar queja (requiere clave de administrador)
    async deleteQueja(req, res) {
        try {
            const startTime = Date.now();
            this.authorizeAdmin(req, process.env.ADMIN_DELETE_KEY);

            const idValidation = this.validateId(req.params.id);
            if (!idValidation.isValid) {
                return this.sendValidationErrorResponse(res, 'ID de queja inválido', idValidation.errors);
            }

            await this.getAndEnsureQuejaExists(idValidation.id);
            await dbService.deleteQueja(idValidation.id);

            return this.sendSuccessResponse(res, null, startTime, 200, { message: 'Queja eliminada exitosamente' });

        } catch (error) {
            this.logError('eliminando queja', error);
            if (error.name === 'AuthorizationError') {
                return this.sendErrorResponse(res, 403, error.message);
            }
            if (error.name === 'NotFoundError') {
                return this.sendErrorResponse(res, 404, error.message);
            }
            return this.sendErrorResponse(res, 500, 'Error eliminando la queja', error);
        }
    }

    // Actualizar estado de una queja
    async updateQuejaStatus(req, res) {
        try {
            const startTime = Date.now();
            this.authorizeAdmin(req, process.env.ADMIN_UPDATE_KEY);

            const idValidation = this.validateId(req.params.id);
            if (!idValidation.isValid) {
                return this.sendValidationErrorResponse(res, 'ID de queja inválido', idValidation.errors);
            }

            const { state } = req.body;
            this.validateState(state);

            const quejaExistente = await this.getAndEnsureQuejaExists(idValidation.id);
            await dbService.updateQuejaState(idValidation.id, state);

            const responseData = {
                id: idValidation.id,
                estadoAnterior: quejaExistente.state,
                estadoNuevo: state,
            };

            return this.sendSuccessResponse(res, responseData, startTime, 200, { message: 'Estado de queja actualizado' });

        } catch (error) {
            this.logError('actualizando estado de queja', error);
            if (error.name === 'AuthorizationError') {
                return this.sendErrorResponse(res, 403, error.message);
            }
            if (error.name === 'NotFoundError') {
                return this.sendErrorResponse(res, 404, error.message);
            }
            if (error.name === 'ValidationError') {
                return this.sendValidationErrorResponse(res, error.message);
            }
            return this.sendErrorResponse(res, 500, 'Error actualizando el estado', error);
        }
    }

    validatePagination(query) {
        const validation = QueryValidator.validatePagination(query);
        if (validation.isValid) {
            if (!validation.params.limit || validation.params.limit > 10) {
                validation.params.limit = 10;
            }
        }
        return validation;
    }

    authorizeAdmin(req, expectedKey) {
        const adminKey = req.body?.adminKey || req.query?.adminKey;
        if (!adminKey || adminKey !== expectedKey) {
            const error = new Error('Clave de administrador incorrecta o faltante');
            error.name = 'AuthorizationError';
            throw error;
        }
    }

    async getAndEnsureQuejaExists(id) {
        const queja = await dbService.getQuejaById(id);
        if (!queja) {
            const error = new Error('Queja no encontrada');
            error.name = 'NotFoundError';
            throw error;
        }
        return queja;
    }

    async getAndEnsureEntidadExists(id) {
        return await dbService.getEntidadById(id);
    }
    
    validateState(state) {
        const validStates = ['open', 'in process', 'closed'];
        if (!state || !validStates.includes(state)) {
            const error = new Error(`Estado inválido. Los estados válidos son: ${validStates.join(', ')}`);
            error.name = 'ValidationError';
            throw error;
        }
    }

    buildPaginationObject(totalCount, limit, offset) {
        const totalPages = Math.ceil(totalCount / limit);
        const currentPage = Math.floor(offset / limit) + 1;
        return {
            total: totalCount,
            limit,
            offset,
            currentPage,
            totalPages,
            hasNext: offset + limit < totalCount,
            hasPrev: offset > 0,
        };
    }

    buildCreateQuejaResponse(nuevaQueja, quejaData, entidad) {
        return {
            id: nuevaQueja.insertId,
            entidad_id: quejaData.entidad_id,
            entidad_nombre: entidad.nombre,
            descripcion: quejaData.descripcion,
            created_at: nuevaQueja.created_at
        };
    }
    
    async fetchQuejasAndCount(limit, offset) {
        return Promise.all([
            dbService.getAllQuejas(limit, offset),
            dbService.getQuejasCount()
        ]);
    }

    async fetchQuejasByEntidadAndCount(entidadId, limit, offset) {
        return Promise.all([
            dbService.getQuejasByEntidad(entidadId, limit, offset),
            dbService.getQuejasByEntidadCount(entidadId)
        ]);
    }
}

module.exports = new QuejasController();