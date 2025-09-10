const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class EntidadesController {
    // Constantes para evitar números mágicos
    static MIN_SEARCH_LENGTH = 2;
    static HTTP_STATUS = {
        OK: 200,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    };

    /**
     * Obtener todas las entidades activas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getAllEntidades(req, res) {
        const startTime = this._getStartTime();
        
        try {
            const entidades = await dbService.getAllEntidades();
            
            this._sendSuccessResponse(res, {
                data: entidades,
                count: entidades.length,
                responseTime: this._calculateResponseTime(startTime)
            });
        } catch (error) {
            this._handleError(res, 'Error obteniendo entidades', error);
        }
    }

    /**
     * Obtener entidad por ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getEntidadById(req, res) {
        const startTime = this._getStartTime();
        
        try {
            const validationResult = this._validateEntityId(req.params.id);
            if (!validationResult.isValid) {
                return this._sendValidationErrorResponse(res, validationResult.errors);
            }

            const entidad = await dbService.getEntidadById(validationResult.id);
            
            if (!entidad) {
                return this._sendNotFoundResponse(res, 'Entidad no encontrada');
            }

            this._sendSuccessResponse(res, {
                data: entidad,
                responseTime: this._calculateResponseTime(startTime)
            });
        } catch (error) {
            this._logError('Error obteniendo entidad', error);
            this._handleError(res, 'Error obteniendo entidad', error);
        }
    }

    /**
     * Buscar entidad por nombre
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async searchEntidadByNombre(req, res) {
        const startTime = this._getStartTime();
        
        try {
            const searchTerm = this._extractSearchTerm(req.query.nombre);
            
            if (!this._isValidSearchTerm(searchTerm)) {
                return this._sendBadRequestResponse(
                    res, 
                    `El nombre debe tener al menos ${EntidadesController.MIN_SEARCH_LENGTH} caracteres`
                );
            }

            const entidad = await dbService.getEntidadByNombre(searchTerm);
            
            this._sendSuccessResponse(res, {
                data: entidad,
                found: this._isEntityFound(entidad),
                responseTime: this._calculateResponseTime(startTime)
            });
        } catch (error) {
            this._logError('Error buscando entidad', error);
            this._handleError(res, 'Error buscando entidad', error);
        }
    }

    // Métodos privados para mejorar la reutilización y legibilidad

    /**
     * Obtiene el timestamp de inicio para medir tiempo de respuesta
     * @returns {number} Timestamp actual
     */
    _getStartTime() {
        return Date.now();
    }

    /**
     * Calcula el tiempo de respuesta
     * @param {number} startTime - Timestamp de inicio
     * @returns {number} Tiempo de respuesta en millisegundos
     */
    _calculateResponseTime(startTime) {
        return Date.now() - startTime;
    }

    /**
     * Valida el ID de la entidad
     * @param {string} id - ID a validar
     * @returns {Object} Resultado de la validación
     */
    _validateEntityId(id) {
        return QueryValidator.validateId(id);
    }

    /**
     * Extrae y limpia el término de búsqueda
     * @param {string} searchTerm - Término de búsqueda sin procesar
     * @returns {string} Término de búsqueda limpio
     */
    _extractSearchTerm(searchTerm) {
        return searchTerm ? searchTerm.trim() : '';
    }

    /**
     * Valida si el término de búsqueda es válido
     * @param {string} searchTerm - Término de búsqueda
     * @returns {boolean} True si es válido
     */
    _isValidSearchTerm(searchTerm) {
        return searchTerm && searchTerm.length >= EntidadesController.MIN_SEARCH_LENGTH;
    }

    /**
     * Verifica si se encontró una entidad
     * @param {Object} entidad - Entidad encontrada
     * @returns {boolean} True si se encontró
     */
    _isEntityFound(entidad) {
        return !!entidad;
    }

    /**
     * Envía una respuesta exitosa
     * @param {Object} res - Response object
     * @param {Object} data - Datos adicionales para la respuesta
     */
    _sendSuccessResponse(res, data = {}) {
        const response = {
            success: true,
            timestamp: this._getCurrentTimestamp(),
            ...data
        };
        
        res.status(EntidadesController.HTTP_STATUS.OK).json(response);
    }

    /**
     * Envía una respuesta de error de validación
     * @param {Object} res - Response object
     * @param {Array} errors - Lista de errores de validación
     */
    _sendValidationErrorResponse(res, errors) {
        res.status(EntidadesController.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'ID inválido',
            errors: errors,
            timestamp: this._getCurrentTimestamp()
        });
    }

    /**
     * Envía una respuesta de recurso no encontrado
     * @param {Object} res - Response object
     * @param {string} message - Mensaje de error
     */
    _sendNotFoundResponse(res, message) {
        res.status(EntidadesController.HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: message,
            timestamp: this._getCurrentTimestamp()
        });
    }

    /**
     * Envía una respuesta de solicitud incorrecta
     * @param {Object} res - Response object
     * @param {string} message - Mensaje de error
     */
    _sendBadRequestResponse(res, message) {
        res.status(EntidadesController.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: message,
            timestamp: this._getCurrentTimestamp()
        });
    }

    /**
     * Maneja errores generales
     * @param {Object} res - Response object
     * @param {string} message - Mensaje de error
     * @param {Error} error - Error original
     */
    _handleError(res, message, error) {
        const response = {
            success: false,
            message: message,
            timestamp: this._getCurrentTimestamp()
        };

        if (this._isDevelopmentEnvironment()) {
            response.error = error.message;
        }

        res.status(EntidadesController.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }

    /**
     * Registra errores en consola
     * @param {string} message - Mensaje de contexto
     * @param {Error} error - Error a registrar
     */
    _logError(message, error) {
        console.error(`❌ ${message}:`, error.message);
    }

    /**
     * Obtiene el timestamp actual en formato ISO
     * @returns {string} Timestamp actual
     */
    _getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Verifica si estamos en ambiente de desarrollo
     * @returns {boolean} True si es desarrollo
     */
    _isDevelopmentEnvironment() {
        return process.env.NODE_ENV === 'development';
    }
}

module.exports = new EntidadesController();