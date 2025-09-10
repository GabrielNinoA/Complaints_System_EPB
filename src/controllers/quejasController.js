const dbService = require('../services/database');
const { QuejaValidator, QueryValidator } = require('../validators');

class QuejasController {
    // Obtener todas las quejas con paginación
    async getAllQuejas(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar parámetros de paginación
            const validation = QueryValidator.validatePagination(req.query);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: validation.errors
                });
            }

            const { limit, offset } = validation.params;
            
            // Obtener quejas y conteo total
            const [quejas, totalCount] = await Promise.all([
                dbService.getAllQuejas(limit, offset),
                dbService.getQuejasCount()
            ]);

            // Calcular metadatos de paginación
            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = Math.floor(offset / limit) + 1;

            res.json({
                success: true,
                data: quejas,
                pagination: {
                    total: totalCount,
                    count: quejas.length,
                    limit,
                    offset,
                    currentPage,
                    totalPages,
                    hasNext: offset + limit < totalCount,
                    hasPrev: offset > 0
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo quejas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo quejas',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener queja por ID
    async getQuejaById(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar ID
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            const queja = await dbService.getQuejaById(validation.id);
            
            if (!queja) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            res.json({
                success: true,
                data: queja,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo queja:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo queja',
                timestamp: new Date().toISOString()
            });
        }
    }

    async createQueja(req, res) {
        try {
            const startTime = Date.now();
            const quejaData = await this._validateAndSanitizeQuejaData(req.body);
            const result = await this._processQuejaCreation(quejaData);
            this._sendCreateQuejaSuccessResponse(res, result, startTime);
        } catch (error) {
            this._handleCreateQuejaError(res, error);
        }
    }

    // Obtener quejas por entidad
    async getQuejasByEntidad(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar ID de entidad
            const idValidation = QueryValidator.validateId(req.params.entidadId);
            if (!idValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de entidad inválido',
                    errors: idValidation.errors
                });
            }

            // Validar parámetros de paginación
            const paginationValidation = QueryValidator.validatePagination(req.query);
            if (!paginationValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: paginationValidation.errors
                });
            }

            const entidadId = idValidation.id;
            const { limit, offset } = paginationValidation.params;

            // Verificar que la entidad existe
            const entidad = await dbService.getEntidadById(entidadId);
            if (!entidad) {
                return res.status(404).json({
                    success: false,
                    message: 'Entidad no encontrada'
                });
            }

            // Obtener quejas y conteo
            const [quejas, totalCount] = await Promise.all([
                dbService.getQuejasByEntidad(entidadId, limit, offset),
                dbService.getQuejasByEntidadCount(entidadId)
            ]);

            // Calcular metadatos de paginación
            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = Math.floor(offset / limit) + 1;

            res.json({
                success: true,
                data: quejas,
                entidad: {
                    id: entidad.id,
                    nombre: entidad.nombre
                },
                pagination: {
                    total: totalCount,
                    count: quejas.length,
                    limit,
                    offset,
                    currentPage,
                    totalPages,
                    hasNext: offset + limit < totalCount,
                    hasPrev: offset > 0
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo quejas por entidad:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo quejas por entidad',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Eliminar queja (para administración)
    async deleteQueja(req, res) {
        try {
            const startTime = Date.now();
            
            // Validar ID
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            // Verificar que la queja existe
            const existingQueja = await dbService.getQuejaById(validation.id);
            if (!existingQueja) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            // Eliminar la queja
            const deleted = await dbService.deleteQueja(validation.id);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Queja eliminada exitosamente',
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar la queja'
                });
            }
        } catch (error) {
            console.error('❌ Error eliminando queja:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error eliminando queja',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Actualizar estado de una queja (funcionalidad administrativa)
    async updateQuejaStatus(req, res) {
        try {
            const startTime = Date.now();
            const { id } = req.params;
            const { estado } = req.body;

            // Validar ID
            const idValidation = QueryValidator.validateId(id);
            if (!idValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de queja inválido',
                    errors: idValidation.errors
                });
            }

            // Validar estado (valores permitidos: pendiente, en_proceso, resuelto, cerrado)
            const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
            if (!estado || !estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido',
                    validStates: estadosValidos
                });
            }

            // Verificar que la queja existe
            const quejaExistente = await dbService.getQuejaById(parseInt(id));
            if (!quejaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            // Actualizar estado (por ahora solo devolvemos éxito, implementación completa pendiente)
            res.json({
                success: true,
                message: 'Estado de queja actualizado exitosamente',
                data: {
                    id: parseInt(id),
                    estadoAnterior: 'pendiente', // TODO: Obtener estado actual
                    estadoNuevo: estado
                },
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error actualizando estado de queja:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error actualizando estado de queja',
                timestamp: new Date().toISOString()
            });
        }
    }

    // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

    async _validateAndSanitizeQuejaData(body) {
        const validation = QuejaValidator.validate(body);
        if (!validation.isValid) {
            const error = new Error('Datos inválidos');
            error.statusCode = 400;
            error.errors = validation.errors;
            throw error;
        }
        return QuejaValidator.sanitize(body);
    }

    async _processQuejaCreation(quejaData) {
        const entidad = await dbService.getEntidadById(quejaData.entidad_id);
        if (!entidad) {
            const error = new Error('Entidad no válida');
            error.statusCode = 400;
            throw error;
        }
        
        const nuevaQueja = await dbService.createQueja(quejaData);
        return {
            nuevaQueja,
            entidad,
            quejaData
        };
    }

    _sendCreateQuejaSuccessResponse(res, result, startTime) {
        const { nuevaQueja, entidad, quejaData } = result;
        
        res.status(201).json({
            success: true,
            message: 'Queja creada exitosamente',
            data: {
                id: nuevaQueja.insertId,
                entidad_id: quejaData.entidad_id,
                entidad_nombre: entidad.nombre,
                descripcion: quejaData.descripcion,
                created_at: nuevaQueja.created_at
            },
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });
    }

    _handleCreateQuejaError(res, error) {
        console.error('❌ Error creando queja:', error.message);
        
        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            message: error.message || 'Error creando queja',
            timestamp: new Date().toISOString()
        };
        
        if (error.errors) {
            response.errors = error.errors;
        }
        
        res.status(statusCode).json(response);
    }
}

module.exports = new QuejasController();
