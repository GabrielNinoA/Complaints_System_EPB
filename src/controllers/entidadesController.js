const dbService = require('../services/database');
const { QueryValidator } = require('../validators');

class EntidadesController {
    // Obtener todas las entidades activas
    async getAllEntidades(req, res) {
        try {
            const startTime = Date.now();
            const entidades = await dbService.getAllEntidades();
            
            res.json({
                success: true,
                data: entidades,
                count: entidades.length,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo entidades',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Obtener entidad por ID
    async getEntidadById(req, res) {
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

            const entidad = await dbService.getEntidadById(validation.id);
            
            if (!entidad) {
                return res.status(404).json({
                    success: false,
                    message: 'Entidad no encontrada'
                });
            }

            res.json({
                success: true,
                data: entidad,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error obteniendo entidad:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo entidad',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Buscar entidad por nombre
    async searchEntidadByNombre(req, res) {
        try {
            const startTime = Date.now();
            const { nombre } = req.query;
            
            if (!nombre || nombre.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre debe tener al menos 2 caracteres'
                });
            }

            const entidad = await dbService.getEntidadByNombre(nombre.trim());
            
            res.json({
                success: true,
                data: entidad,
                found: !!entidad,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        } catch (error) {
            console.error('❌ Error buscando entidad:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error buscando entidad',
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new EntidadesController();
