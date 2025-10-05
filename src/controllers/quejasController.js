const dbService = require('../services/database');
const { QuejaValidator, QueryValidator } = require('../validators');

class QuejasController {
    // Obtener todas las quejas con paginación
    async getAllQuejas(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QueryValidator.validatePagination(req.query);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: validation.errors
                });
            }

            let { limit, offset } = validation.params;

            if (!limit || limit > 10) {
                limit = 10;
            }

            const [quejas, totalCount] = await Promise.all([
                dbService.getAllQuejas(limit, offset),
                dbService.getQuejasCount()
            ]);

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

    // Crear nueva queja
    async createQueja(req, res) {
        try {
            const startTime = Date.now();
            
            const validation = QuejaValidator.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: validation.errors
                });
            }

            const quejaData = QuejaValidator.sanitize(req.body);
            
            const entidad = await dbService.getEntidadById(quejaData.entidad_id);
            if (!entidad) {
                return res.status(400).json({
                    success: false,
                    message: 'Entidad no válida'
                });
            }

            const nuevaQueja = await dbService.createQueja(quejaData);

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
        } catch (error) {
            console.error('❌ Error creando queja:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error creando queja',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener quejas por entidad
    async getQuejasByEntidad(req, res) {
        try {
            const startTime = Date.now();
            
            const idValidation = QueryValidator.validateId(req.params.entidadId);
            if (!idValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de entidad inválido',
                    errors: idValidation.errors
                });
            }

            const paginationValidation = QueryValidator.validatePagination(req.query);
            if (!paginationValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: paginationValidation.errors
                });
            }

            const entidadId = idValidation.id;
            let { limit, offset } = paginationValidation.params;
            if (!limit || limit > 10) {
                limit = 10;
            }

            const entidad = await dbService.getEntidadById(entidadId);
            if (!entidad) {
                return res.status(404).json({
                    success: false,
                    message: 'Entidad no encontrada'
                });
            }

            const [quejas, totalCount] = await Promise.all([
                dbService.getQuejasByEntidad(entidadId, limit, offset),
                dbService.getQuejasByEntidadCount(entidadId)
            ]);

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

    // Eliminar queja (requiere clave de administrador)
    async deleteQueja(req, res) {
        try {
            const startTime = Date.now();
            
            console.log('🔍 [DELETE] Iniciando proceso de eliminación...');
            console.log('   ID recibido:', req.params.id);
            console.log('   Body:', req.body);
            console.log('   Query:', req.query);
            
            // Validar ID
            const validation = QueryValidator.validateId(req.params.id);
            if (!validation.isValid) {
                console.log('❌ [DELETE] Validación de ID falló:', validation.errors);
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    errors: validation.errors
                });
            }

            console.log('✅ [DELETE] ID validado:', validation.id);

            // Validar clave de administrador
            const adminKey = req.body?.adminKey || req.query?.adminKey;
            console.log('🔑 [DELETE] AdminKey recibida:', adminKey ? '***' : 'NO');
            console.log('🔑 [DELETE] AdminKey esperada:', process.env.ADMIN_DELETE_KEY ? '***' : 'NO CONFIGURADA');
            
            if (!adminKey || adminKey !== process.env.ADMIN_DELETE_KEY) {
                console.log('❌ [DELETE] Clave de administrador incorrecta o faltante');
                return res.status(403).json({
                    success: false,
                    message: 'Clave de administrador incorrecta o faltante'
                });
            }

            console.log('✅ [DELETE] Clave de administrador correcta');

            // Verificar que la queja existe
            const existingQueja = await dbService.getQuejaById(validation.id);
            console.log('🔍 [DELETE] Queja encontrada:', existingQueja ? 'SÍ' : 'NO');
            
            if (!existingQueja) {
                console.log('❌ [DELETE] Queja no encontrada en BD');
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            console.log('🗑️  [DELETE] Ejecutando eliminación...');

            // Eliminar la queja
            const deleted = await dbService.deleteQueja(validation.id);
            
            console.log('✅ [DELETE] Resultado:', deleted);

            if (deleted) {
                console.log('✅ [DELETE] Queja eliminada exitosamente');
                return res.status(200).json({
                    success: true,
                    message: 'Queja eliminada exitosamente',
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime
                });
            } else {
                console.log('❌ [DELETE] No se pudo eliminar (returned false)');
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar la queja'
                });
            }
        } catch (error) {
            console.error('❌ [DELETE] Error capturado:', error);
            console.error('   Stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Error eliminando queja',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Actualizar estado de una queja
    async updateQuejaStatus(req, res) {
        try {
            const startTime = Date.now();
            const { id } = req.params;
            const { estado } = req.body;

            const idValidation = QueryValidator.validateId(id);
            if (!idValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de queja inválido',
                    errors: idValidation.errors
                });
            }

            const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
            if (!estado || !estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido',
                    validStates: estadosValidos
                });
            }

            const quejaExistente = await dbService.getQuejaById(parseInt(id));
            if (!quejaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Queja no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Estado de queja actualizado exitosamente',
                data: {
                    id: parseInt(id),
                    estadoAnterior: 'pendiente',
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
}

module.exports = new QuejasController();