const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class EntidadesController {
    static MIN_SEARCH_LENGTH = 2;
    static HTTP_STATUS_OK = 200;
    static HTTP_STATUS_BAD_REQUEST = 400;
    static HTTP_STATUS_NOT_FOUND = 404;
    static HTTP_STATUS_SERVER_ERROR = 500;

    async getAllEntidades(req, res) {
        try {
            const startTime = Date.now();
            const entidades = await dbService.getAllEntidades();
            
            this._sendSuccessResponse(res, {
                data: entidades,
                count: entidades.length,
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo entidades', error);
        }
    }

    async getEntidadById(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(EntidadesController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            const entidad = await dbService.getEntidadById(validation.id);
            
            if (!entidad) {
                return res.status(EntidadesController.HTTP_STATUS_NOT_FOUND).json({
                    success: false,
                    message: 'Entidad no encontrada'
                });
            }

            this._sendSuccessResponse(res, {
                data: entidad,
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo entidad:', error.message);
            this._sendErrorResponse(res, 'Error obteniendo entidad', error);
        }
    }

    async searchEntidadByNombre(req, res) {
        try {
            const startTime = Date.now();
            const { nombre } = req.query;
            
            if (!nombre || nombre.trim().length < EntidadesController.MIN_SEARCH_LENGTH) {
                return res.status(EntidadesController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: `El nombre debe tener al menos ${EntidadesController.MIN_SEARCH_LENGTH} caracteres`
                });
            }

            const entidad = await dbService.getEntidadByNombre(nombre.trim());
            
            this._sendSuccessResponse(res, {
                data: entidad,
                found: !!entidad,
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error buscando entidad:', error.message);
            this._sendErrorResponse(res, 'Error buscando entidad', error);
        }
    }

    _sendSuccessResponse(res, data) {
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    _sendErrorResponse(res, message, error) {
        res.status(EntidadesController.HTTP_STATUS_SERVER_ERROR).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new EntidadesController();