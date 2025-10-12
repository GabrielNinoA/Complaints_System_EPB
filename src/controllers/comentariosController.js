const dbService = require('../services/database');
const { ComentarioValidator, QueryValidator } = require('../validators');

class ComentariosController {
    constructor() {
        this.startTime = null;
    }

    initResponseTime() {
        this.startTime = Date.now();
    }

    getResponseTime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }

    successResponse(res, data, message = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            responseTime: this.getResponseTime()
        });
    }

    successResponseNoData(res, message = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            timestamp: new Date().toISOString(),
            responseTime: this.getResponseTime()
        });
    }

    errorResponse(res, message = 'Error interno del servidor', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            ...(errors && { errors }),
            timestamp: new Date().toISOString(),
            ...(this.startTime && { responseTime: this.getResponseTime() })
        });
    }

    validateIdParam(param) {
        return QueryValidator.validateId(param);
    }

    handleIdValidation(res, validation) {
        if (!validation.isValid) {
            return this.errorResponse(res, 'ID inválido', 400, validation.errors);
        }
        return null; // Indica que la validación pasó
    }

    // Helper para validar que un recurso existe
    async validateResourceExists(res, resourceId, getResourceFn, resourceName) {
        const resource = await getResourceFn(resourceId);
        if (!resource) {
            return {
                exists: false,
                error: this.errorResponse(res, `${resourceName} no encontrado`, 404)
            };
        }
        return { exists: true, resource };
    }

    getComentariosByQueja = async (req, res) => {
        try {
            this.initResponseTime();
            
            const validation = this.validateIdParam(req.params.quejaId);
            const idError = this.handleIdValidation(res, validation);
            if (idError) return idError;

            const quejaId = validation.id;
            
            const quejaValidation = await this.validateResourceExists(res, quejaId, dbService.getQuejaById.bind(dbService), 'Queja');
            if (!quejaValidation.exists) return quejaValidation.error;

            const comentarios = await dbService.getComentariosByQueja(quejaId);

            const responseData = {
                ...comentarios,
                count: comentarios.length,
                queja: {
                    id: quejaValidation.resource.id,
                    entidad: quejaValidation.resource.entidad_nombre
                }
            };

            return this.successResponse(res, responseData);
        } catch (error) {
            console.error('❌ Error obteniendo comentarios:', error.message);
            return this.errorResponse(res, 'Error obteniendo comentarios');
        }
    }

    getComentarioById = async (req, res) => {
        try {
            this.initResponseTime();
            
            const validation = this.validateIdParam(req.params.id);
            const idError = this.handleIdValidation(res, validation);
            if (idError) return idError;

            const comentarioValidation = await this.validateResourceExists(res, validation.id, dbService.getComentarioById.bind(dbService), 'Comentario');
            if (!comentarioValidation.exists) return comentarioValidation.error;

            return this.successResponse(res, comentarioValidation.resource);
        } catch (error) {
            console.error('❌ Error obteniendo comentario:', error.message);
            return this.errorResponse(res, 'Error obteniendo comentario');
        }
    }

    createComentario = async (req, res) => {
        try {
            this.initResponseTime();
            
            const validation = ComentarioValidator.validate(req.body);
            if (!validation.isValid) {
                return this.errorResponse(res, 'Datos inválidos', 400, validation.errors);
            }

            const comentarioData = ComentarioValidator.sanitize(req.body);
            
            const quejaValidation = await this.validateResourceExists(res, comentarioData.queja_id, dbService.getQuejaById.bind(dbService), 'La queja especificada');
            if (!quejaValidation.exists) {
                return this.errorResponse(res, 'La queja especificada no existe', 400);
            }

            const nuevoComentario = await dbService.createComentario(comentarioData);

            return this.successResponse(res, nuevoComentario, 'Comentario creado exitosamente', 201);
        } catch (error) {
            console.error('❌ Error creando comentario:', error.message);
            return this.errorResponse(res, 'Error creando comentario');
        }
    }

    updateComentario = async (req, res) => {
        try {
            this.initResponseTime();
            
            const idValidation = this.validateIdParam(req.params.id);
            const idError = this.handleIdValidation(res, idValidation);
            if (idError) return idError;

            const { texto } = req.body;
            
            if (!texto || texto.trim().length < 5) {
                return this.errorResponse(res, 'El texto del comentario debe tener al menos 5 caracteres', 400);
            }

            if (texto.trim().length > 1000) {
                return this.errorResponse(res, 'El comentario no puede exceder 1000 caracteres', 400);
            }

            const comentarioValidation = await this.validateResourceExists(idValidation.id, dbService.getComentarioById.bind(dbService), 'Comentario');
            if (!comentarioValidation.exists) return comentarioValidation.error;

            const updated = await dbService.updateComentario(idValidation.id, texto.trim());
            
            if (updated) {
                const comentarioActualizado = await dbService.getComentarioById(idValidation.id);
                return this.successResponse(res, comentarioActualizado, 'Comentario actualizado exitosamente');
            } else {
                return this.errorResponse(res, 'No se pudo actualizar el comentario', 400);
            }
        } catch (error) {
            console.error('❌ Error actualizando comentario:', error.message);
            return this.errorResponse(res, 'Error actualizando comentario');
        }
    }

    deleteComentario = async (req, res) => {
        try {
            this.initResponseTime();
            
            const validation = this.validateIdParam(req.params.id);
            const idError = this.handleIdValidation(res, validation);
            if (idError) return idError;

            const comentarioValidation = await this.validateResourceExists(res, validation.id, dbService.getComentarioById.bind(dbService), 'Comentario');
            if (!comentarioValidation.exists) return comentarioValidation.error;

            const deleted = await dbService.deleteComentario(validation.id);
            
            if (deleted) {
                return this.successResponseNoData(res, 'Comentario eliminado exitosamente');
            } else {
                return this.errorResponse(res, 'No se pudo eliminar el comentario', 400);
            }
        } catch (error) {
            console.error('❌ Error eliminando comentario:', error.message);
            return this.errorResponse(res, 'Error eliminando comentario');
        }
    }
}

module.exports = new ComentariosController();