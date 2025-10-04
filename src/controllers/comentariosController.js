const dbService = require('../services/database');
const { ComentarioValidator, QueryValidator } = require('../validators');

class ComentariosController {
    // Obtener todos los comentarios de una queja
    async getComentariosByQueja(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.quejaId);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de queja inválido',
                    errors: validation.errors
                });
            }

            const quejaId = validation.id;
            
            const queja = await dbService.getQuejaById(quejaId);
            if (!queja) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            const comentarios = await dbService.getComentariosByQueja(quejaId);

            res.json({
                success: true,
                data: comentarios,
                count: comentarios.length,
                queja: {
                    id: queja.id,
                    entidad: queja.entidad_nombre
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo comentarios:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo comentarios',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener un comentario por ID
    async getComentarioById(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            const comentario = await dbService.getComentarioById(validation.id);
            
            if (!comentario) {
                return res.status(404).json({
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
            console.error('❌ Error obteniendo comentario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo comentario',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Crear nuevo comentario
    async createComentario(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = ComentarioValidator.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: validation.errors
                });
            }

            const comentarioData = ComentarioValidator.sanitize(req.body);
            
            const queja = await dbService.getQuejaById(comentarioData.queja_id);
            if (!queja) {
                return res.status(400).json({
                    success: false,
                    message: 'La queja especificada no existe'
                });
            }

            const nuevoComentario = await dbService.createComentario(comentarioData);

            res.status(201).json({
                success: true,
                message: 'Comentario creado exitosamente',
                data: nuevoComentario,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error creando comentario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error creando comentario',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Actualizar comentario
    async updateComentario(req, res) {
        try {
            const startTime = Date.now();
            
            const idValidation = QueryValidator.validateId(req.params.id);
            if (!idValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: idValidation.errors
                });
            }

            const { texto } = req.body;
            
            if (!texto || texto.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'El texto del comentario debe tener al menos 5 caracteres'
                });
            }

            if (texto.trim().length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'El comentario no puede exceder 1000 caracteres'
                });
            }

            const existingComentario = await dbService.getComentarioById(idValidation.id);
            if (!existingComentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            const updated = await dbService.updateComentario(idValidation.id, texto.trim());
            
            if (updated) {
                const comentarioActualizado = await dbService.getComentarioById(idValidation.id);
                
                res.json({
                    success: true,
                    message: 'Comentario actualizado exitosamente',
                    data: comentarioActualizado,
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el comentario'
                });
            }
        } catch (error) {
            console.error('❌ Error actualizando comentario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error actualizando comentario',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Eliminar comentario
    async deleteComentario(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            const existingComentario = await dbService.getComentarioById(validation.id);
            if (!existingComentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            const deleted = await dbService.deleteComentario(validation.id);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Comentario eliminado exitosamente',
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el comentario'
                });
            }
        } catch (error) {
            console.error('❌ Error eliminando comentario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error eliminando comentario',
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new ComentariosController();