const dbService = require('../services/database');
const { ComentarioValidator, QueryValidator } = require('../validators');

class ComentariosController {
    static HTTP_STATUS_OK = 200;
    static HTTP_STATUS_CREATED = 201;
    static HTTP_STATUS_BAD_REQUEST = 400;
    static HTTP_STATUS_NOT_FOUND = 404;
    static HTTP_STATUS_SERVER_ERROR = 500;

    // Obtener todos los comentarios de una queja
    async getComentariosByQueja(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar ID de queja
            const validation = QueryValidator.validateId(req.params.quejaId);
            if (!validation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'ID de queja inválido',
                    errors: validation.errors
                });
            }

            const quejaId = validation.id;

            // Verificar que la queja existe
            const queja = await dbService.getQuejaById(quejaId);
            if (!queja) {
                return res.status(ComentariosController.HTTP_STATUS_NOT_FOUND).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            // Obtener comentarios
            const comentarios = await dbService.getAllComentarios(quejaId);

            res.json({
                success: true,
                data: comentarios,
                queja: {
                    id: queja.id,
                    descripcion: queja.descripcion,
                    entidad_nombre: queja.entidad_nombre
                },
                count: comentarios.length,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo comentarios', error);
        }
    }

    // Obtener comentario por ID
    async getComentarioById(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'ID de comentario inválido',
                    errors: validation.errors
                });
            }

            const comentario = await dbService.getComentarioById(validation.id);
            
            if (!comentario) {
                return res.status(ComentariosController.HTTP_STATUS_NOT_FOUND).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            res.json({
                success: true,
                data: comentario,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo comentario', error);
        }
    }

    // Crear nuevo comentario
    async createComentario(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar datos del comentario
            const validation = ComentarioValidator.validate(req.body);
            if (!validation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'Datos del comentario inválidos',
                    errors: validation.errors
                });
            }

            const comentarioData = ComentarioValidator.sanitize(req.body);

            // Verificar que la queja existe
            const queja = await dbService.getQuejaById(comentarioData.queja_id);
            if (!queja) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'La queja especificada no existe'
                });
            }

            // Crear el comentario
            const nuevoComentario = await dbService.createComentario(comentarioData);

            res.status(ComentariosController.HTTP_STATUS_CREATED).json({
                success: true,
                message: 'Comentario creado exitosamente',
                data: {
                    id: nuevoComentario.insertId,
                    queja_id: comentarioData.queja_id,
                    texto: comentarioData.texto,
                    fecha_comentario: nuevoComentario.fecha_comentario,
                    queja_descripcion: queja.descripcion,
                    entidad_nombre: queja.entidad_nombre
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error creando comentario', error);
        }
    }

    // Actualizar comentario
    async updateComentario(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar ID del comentario
            const idValidation = QueryValidator.validateId(req.params.id);
            if (!idValidation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'ID de comentario inválido',
                    errors: idValidation.errors
                });
            }

            const comentarioId = idValidation.id;

            // Validar el texto del comentario
            const { texto } = req.body;
            const textValidation = ComentarioValidator.validateTexto(texto);
            if (!textValidation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'Texto del comentario inválido',
                    errors: textValidation.errors
                });
            }

            // Verificar que el comentario existe
            const comentarioExistente = await dbService.getComentarioById(comentarioId);
            if (!comentarioExistente) {
                return res.status(ComentariosController.HTTP_STATUS_NOT_FOUND).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            // Actualizar el comentario
            const actualizado = await dbService.updateComentario(comentarioId, texto.trim());
            
            if (actualizado) {
                // Obtener el comentario actualizado
                const comentarioActualizado = await dbService.getComentarioById(comentarioId);
                
                res.json({
                    success: true,
                    message: 'Comentario actualizado exitosamente',
                    data: comentarioActualizado,
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'No se pudo actualizar el comentario'
                });
            }
        } catch (error) {
            this._sendErrorResponse(res, 'Error actualizando comentario', error);
        }
    }

    // Eliminar comentario
    async deleteComentario(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'ID de comentario inválido',
                    errors: validation.errors
                });
            }

            const comentarioId = validation.id;

            // Verificar que el comentario existe
            const comentarioExistente = await dbService.getComentarioById(comentarioId);
            if (!comentarioExistente) {
                return res.status(ComentariosController.HTTP_STATUS_NOT_FOUND).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            // Eliminar el comentario
            const eliminado = await dbService.deleteComentario(comentarioId);
            
            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Comentario eliminado exitosamente',
                    data: {
                        id: comentarioId,
                        queja_id: comentarioExistente.queja_id
                    },
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                    success: false,
                    message: 'No se pudo eliminar el comentario'
                });
            }
        } catch (error) {
            this._sendErrorResponse(res, 'Error eliminando comentario', error);
        }
    }

    // Obtener estadísticas de comentarios
    async getEstadisticasComentarios(req, res) {
        try {
            const startTime = Date.now();
            
            // Obtener estadísticas básicas
            const estadisticas = await dbService.getEstadisticasGenerales();
            
            // Obtener actividad reciente de comentarios
            const actividadReciente = await dbService.getQuejasConComentariosRecientes(10);
            
            res.json({
                success: true,
                data: {
                    resumen: {
                        total_comentarios: estadisticas.totalComentarios,
                        comentarios_hoy: estadisticas.comentariosHoy,
                        comentarios_mes: estadisticas.comentariosMes,
                        total_quejas: estadisticas.totalQuejas
                    },
                    actividad_reciente: actividadReciente
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo estadísticas de comentarios', error);
        }
    }

    // Obtener comentarios por rango de fechas
    async getComentariosByDateRange(req, res) {
        try {
            const startTime = Date.now();
            
            const { fechaInicio, fechaFin, quejaId } = req.query;
            
            // Validar fechas si se proporcionan
            if (fechaInicio || fechaFin) {
                const dateValidation = FilterValidator.validateDateRange({ fechaInicio, fechaFin });
                if (!dateValidation.isValid) {
                    return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                        success: false,
                        message: 'Rango de fechas inválido',
                        errors: dateValidation.errors
                    });
                }
            }

            // Si se especifica quejaId, validarlo
            if (quejaId) {
                const quejaValidation = QueryValidator.validateId(quejaId);
                if (!quejaValidation.isValid) {
                    return res.status(ComentariosController.HTTP_STATUS_BAD_REQUEST).json({
                        success: false,
                        message: 'ID de queja inválido',
                        errors: quejaValidation.errors
                    });
                }
            }

            // Construir query dinámicamente (implementación básica)
            let baseQuery = `
                SELECT 
                    c.id,
                    c.queja_id,
                    c.texto,
                    c.fecha_comentario,
                    q.descripcion as queja_descripcion,
                    e.nombre as entidad_nombre
                FROM comentarios c
                INNER JOIN quejas q ON c.queja_id = q.id
                INNER JOIN entidades e ON q.entidad_id = e.id
                WHERE 1=1
            `;
            const queryParams = [];

            if (quejaId) {
                baseQuery += ' AND c.queja_id = ?';
                queryParams.push(parseInt(quejaId));
            }

            if (fechaInicio) {
                baseQuery += ' AND DATE(c.fecha_comentario) >= ?';
                queryParams.push(fechaInicio);
            }

            if (fechaFin) {
                baseQuery += ' AND DATE(c.fecha_comentario) <= ?';
                queryParams.push(fechaFin);
            }

            baseQuery += ' ORDER BY c.fecha_comentario DESC';

            const comentarios = await dbService.execute(baseQuery, queryParams);

            res.json({
                success: true,
                data: comentarios,
                filters: {
                    fechaInicio: fechaInicio || null,
                    fechaFin: fechaFin || null,
                    quejaId: quejaId || null
                },
                count: comentarios.length,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            this._sendErrorResponse(res, 'Error obteniendo comentarios por fecha', error);
        }
    }

    // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

    _sendErrorResponse(res, message, error) {
        console.error(`❌ ${message}:`, error.message);
        
        const statusCode = error.statusCode || ComentariosController.HTTP_STATUS_SERVER_ERROR;
        const response = {
            success: false,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        if (process.env.NODE_ENV === 'development') {
            response.error = error.message;
        }
        
        res.status(statusCode).json(response);
    }
}

module.exports = new ComentariosController();