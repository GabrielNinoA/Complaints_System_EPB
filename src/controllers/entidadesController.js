const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class EntidadesController {
    /**
     * Envía una respuesta exitosa estandarizada
     */
    sendSuccessResponse(res, data, startTime, additionalFields = {}) {
        const response = {
            success: true,
            data,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            ...additionalFields
        };
        return res.json(response);
    }

    /**
     * Envía una respuesta de error estandarizada
     */
    sendErrorResponse(res, statusCode, message, error = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };
        if (error && process.env.NODE_ENV === 'development') {
            response.error = error.message;
        }
        return res.status(statusCode).json(response);
    }

    /**
     * Envía una respuesta de error de validación
     */
    sendValidationErrorResponse(res, message, errors = []) {
        return res.status(400).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra errores de manera consistente
     */
    logError(operation, error) {
        console.error(`❌ Error ${operation}:`, error.message);
    }

    /**
     * Obtiene todas las entidades
     */
    async getAllEntidades(req, res) {
        try {
            const startTime = Date.now();
            const entidades = await dbService.getAllEntidades();

            return this.sendSuccessResponse(res, entidades, startTime, {
                count: entidades.length
            });
        } catch (error) {
            this.logError('obteniendo entidades', error);
            return this.sendErrorResponse(res, 500, 'Error obteniendo entidades', error);
        }
    }

    /**
     * Obtiene una entidad por ID
     */
    async getEntidadById(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = this.validateIdParameter(req.params.id);
            if (!validation.isValid) {
                return this.sendValidationErrorResponse(res, 'ID inválido', validation.errors);
            }

            const entidad = await dbService.getEntidadById(validation.id);
            if (!entidad) {
                return this.sendErrorResponse(res, 404, 'Entidad no encontrada');
            }

            return this.sendSuccessResponse(res, entidad, startTime);
        } catch (error) {
            this.logError('obteniendo entidad', error);
            return this.sendErrorResponse(res, 500, 'Error obteniendo entidad', error);
        }
    }

    /**
     * Busca una entidad por nombre
     */
    async searchEntidadByNombre(req, res) {
        try {
            const startTime = Date.now();
            
            const nombre = this.validateNombreParameter(req.query.nombre);
            if (!nombre.isValid) {
                return this.sendValidationErrorResponse(res, nombre.message);
            }

            const entidad = await dbService.getEntidadByNombre(nombre.value);

            return this.sendSuccessResponse(res, entidad, startTime, {
                found: !!entidad
            });
        } catch (error) {
            this.logError('buscando entidad', error);
            return this.sendErrorResponse(res, 500, 'Error buscando entidad', error);
        }
    }

    /**
     * Valida el parámetro ID
     */
    validateIdParameter(id) {
        return QueryValidator.validateId(id);
    }

    /**
     * Valida el parámetro nombre
     */
    validateNombreParameter(nombre) {
        if (!nombre || nombre.trim().length < 2) {
            return {
                isValid: false,
                message: 'El nombre debe tener al menos 2 caracteres'
            };
        }
        return {
            isValid: true,
            value: nombre.trim()
        };
    }
}

module.exports = new EntidadesController();