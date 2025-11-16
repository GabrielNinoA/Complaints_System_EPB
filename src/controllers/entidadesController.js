const dbService = require('../services/database');
const { QueryValidator } = require('../validators');
const auditService = require('../services/auditService');

class EntidadesController {
    constructor() {
        this.getAllEntidades = this.getAllEntidades.bind(this);
        this.getEntidadById = this.getEntidadById.bind(this);
        this.searchEntidadByNombre = this.searchEntidadByNombre.bind(this);
    }
     
    _sendSuccessResponse(res, data, extras = {}) {
        res.json({
            success: true,
            data,
            ...extras,
            timestamp: new Date().toISOString()
        });
    }

    _sendErrorResponse(res, message, statusCode = 500, error = null) {
        console.error(`❌ ${message}:`, error?.message || '');
        if (error?.stack) console.error('❌ Stack trace:', error.stack);
        
        res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            timestamp: new Date().toISOString()
        });
    }

    _sendValidationErrorResponse(res, message, errors = []) {
        res.status(400).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        });
    }

    _getResponseTime(startTime) {
        return Date.now() - startTime;
    }

    _validateIdParameter(id) {
        return QueryValidator.validateId(id);
    }

    _validateNombreParameter(nombre) {
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

    async getAllEntidades(req, res) {
        const startTime = Date.now();
        
        try {
            const entidades = await dbService.getAllEntidades();

            this._sendSuccessResponse(res, entidades, {
                count: entidades.length,
                responseTime: this._getResponseTime(startTime)
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo entidades', 500, error);
        }
    }

    async getEntidadById(req, res) {
        const startTime = Date.now();
        
        try {
            const validation = this._validateIdParameter(req.params.id);
            if (!validation.isValid) {
                return this._sendValidationErrorResponse(res, 'ID inválido', validation.errors);
            }

            const entidad = await dbService.getEntidadById(validation.id);
            if (!entidad) {
                return this._sendErrorResponse(res, 'Entidad no encontrada', 404);
            }

            // Registrar auditoría de consulta (no bloqueante)
            auditService.logRead('entidades', validation.id, entidad).catch(err => {
                console.error('⚠️  Error en auditoría READ:', err.message);
            });

            this._sendSuccessResponse(res, entidad, {
                responseTime: this._getResponseTime(startTime)
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo entidad', 500, error);
        }
    }

    async searchEntidadByNombre(req, res) {
        const startTime = Date.now();
        
        try {
            const nombre = this._validateNombreParameter(req.query.nombre);
            if (!nombre.isValid) {
                return this._sendValidationErrorResponse(res, nombre.message);
            }

            const entidad = await dbService.getEntidadByNombre(nombre.value);

            // Registrar auditoría de consulta si se encontró (no bloqueante)
            if (entidad) {
                auditService.logRead('entidades', entidad.id, entidad).catch(err => {
                    console.error('⚠️  Error en auditoría READ:', err.message);
                });
            }

            this._sendSuccessResponse(res, entidad, {
                found: !!entidad,
                responseTime: this._getResponseTime(startTime)
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error buscando entidad', 500, error);
        }
    }
}

module.exports = new EntidadesController();