const repository = require('../repository/Repository');
const validationService = require('./ValidationService');

class DatabaseService {
    
    async initialize() {
        return await repository.initialize();
    }

    async ensureConnection() {
        return await repository.ensureConnection();
    }

    async healthCheck() {
        try {
            return await repository.healthCheck();
        } catch (error) {
            console.error('❌ Health check falló:', error.message);
            return false;
        }
    }

    async getConnectionInfo() {
        try {
            return await repository.getConnectionInfo();
        } catch (error) {
            console.error('❌ Error obteniendo información de conexión:', error.message);
            return null;
        }
    }

    async close() {
        return await repository.close();
    }

    async execute(query, params = []) {
        return await repository.execute(query, params);
    }

    async getAllEntidades() {
        return await repository.findAllEntidades();
    }

    async getEntidadById(id) {
        // Validar ID
        const validation = validationService.validateId(id);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.findEntidadById(validation.id);
    }

    async getEntidadByNombre(nombre) {
        const validation = validationService.validateNombre(nombre);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.findEntidadByNombre(validation.value);
    }

    async getAllQuejas(limit = 100, offset = 0) {
        const validation = validationService.validatePagination({ limit, offset });
        
        return await repository.findAllQuejas(
            validation.params.limit, 
            validation.params.offset
        );
    }

    async getQuejaById(id) {
        const validation = validationService.validateId(id);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.findQuejaById(validation.id);
    }

    async createQueja(quejaData) {
        const validation = validationService.validateQueja(quejaData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const sanitizedData = validationService.sanitizeQueja(quejaData);

        const entidad = await repository.findEntidadById(sanitizedData.entidad_id);
        const entidadValidation = validationService.validateEntidadExists(entidad);
        if (!entidadValidation.isValid) {
            throw new Error(entidadValidation.errors.join(', '));
        }

        const insertId = await repository.insertQueja(
            sanitizedData.entidad_id,
            sanitizedData.descripcion
        );
        
        const newQueja = await repository.findQuejaById(insertId);
        return {
            insertId,
            ...newQueja
        };
    }

    async getQuejasByEntidad(entidadId, limit = 50, offset = 0) {
        const idValidation = validationService.validateId(entidadId);
        if (!idValidation.isValid) {
            throw new Error(idValidation.errors.join(', '));
        }

        const paginationValidation = validationService.validatePagination({ limit, offset });

        return await repository.findQuejasByEntidad(
            idValidation.id,
            paginationValidation.params.limit,
            paginationValidation.params.offset
        );
    }

    async deleteQueja(id) {
        const validation = validationService.validateId(id);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const queja = await repository.findQuejaById(validation.id);
        const quejaValidation = validationService.validateQuejaExists(queja);
        if (!quejaValidation.isValid) {
            throw new Error(quejaValidation.errors.join(', '));
        }

        return await repository.deleteQuejaById(validation.id);
    }

    async updateQuejaState(id, state) {
        const idValidation = validationService.validateId(id);
        if (!idValidation.isValid) {
            throw new Error(idValidation.errors.join(', '));
        }

        const stateValidation = validationService.validateQuejaState(state);
        if (!stateValidation.isValid) {
            throw new Error(stateValidation.errors.join(', '));
        }

        const queja = await repository.findQuejaById(idValidation.id);
        const quejaValidation = validationService.validateQuejaExists(queja);
        if (!quejaValidation.isValid) {
            throw new Error(quejaValidation.errors.join(', '));
        }

        return await repository.updateQuejaState(idValidation.id, state);
    }


    async getComentariosByQueja(quejaId) {
        const validation = validationService.validateId(quejaId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const queja = await repository.findQuejaById(validation.id);
        const quejaValidation = validationService.validateQuejaExists(queja);
        if (!quejaValidation.isValid) {
            throw new Error(quejaValidation.errors.join(', '));
        }

        return await repository.findComentariosByQueja(validation.id);
    }

    async getComentarioById(id) {
        const validation = validationService.validateId(id);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.findComentarioById(validation.id);
    }

    async createComentario(comentarioData) {
        const validation = validationService.validateComentario(comentarioData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const sanitizedData = validationService.sanitizeComentario(comentarioData);

        const queja = await repository.findQuejaById(sanitizedData.queja_id);
        const quejaValidation = validationService.validateQuejaExists(queja);
        if (!quejaValidation.isValid) {
            throw new Error(quejaValidation.errors.join(', '));
        }

        const insertId = await repository.insertComentario(
            sanitizedData.queja_id,
            sanitizedData.texto
        );
        
        const newComentario = await repository.findComentarioById(insertId);
        return {
            insertId,
            ...newComentario
        };
    }

    async updateComentario(id, texto) {
        const idValidation = validationService.validateId(id);
        if (!idValidation.isValid) {
            throw new Error(idValidation.errors.join(', '));
        }

        const textoValidation = validationService.validateComentarioUpdate(texto);
        if (!textoValidation.isValid) {
            throw new Error(textoValidation.errors.join(', '));
        }

        const comentario = await repository.findComentarioById(idValidation.id);
        const comentarioValidation = validationService.validateComentarioExists(comentario);
        if (!comentarioValidation.isValid) {
            throw new Error(comentarioValidation.errors.join(', '));
        }

        return await repository.updateComentario(idValidation.id, textoValidation.value);
    }

    async deleteComentario(id) {
        const validation = validationService.validateId(id);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const comentario = await repository.findComentarioById(validation.id);
        const comentarioValidation = validationService.validateComentarioExists(comentario);
        if (!comentarioValidation.isValid) {
            throw new Error(comentarioValidation.errors.join(', '));
        }

        return await repository.deleteComentarioById(validation.id);
    }

    async getComentariosCount(quejaId) {
        const validation = validationService.validateId(quejaId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.countComentariosByQueja(validation.id);
    }

    async getEstadisticasGenerales() {
        const [
            totalQuejas,
            totalEntidades,
            totalComentarios,
            quejasHoy,
            quejasMes,
            comentariosHoy
        ] = await Promise.all([
            repository.countAllQuejas(),
            repository.countAllEntidades(),
            repository.countAllComentarios(),
            repository.countQuejasToday(),
            repository.countQuejasThisMonth(),
            repository.countComentariosToday()
        ]);

        return {
            totalQuejas,
            totalEntidades,
            totalComentarios,
            quejasHoy,
            quejasMes,
            comentariosHoy
        };
    }

    async getQuejasPorEntidad() {
        return await repository.findQuejasPorEntidad();
    }

    async getQuejasPorMes(limite = 12) {
        const validation = validationService.validateLimit(limite, 100);
        
        return await repository.findQuejasPorMes(validation.value);
    }

    async getQuejasCount() {
        return await repository.countQuejas();
    }

    async getQuejasByEntidadCount(entidadId) {
        const validation = validationService.validateId(entidadId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await repository.countQuejasByEntidad(validation.id);
    }
}

module.exports = new DatabaseService();