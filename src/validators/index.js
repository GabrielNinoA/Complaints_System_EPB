// Validador para datos de quejas
class QuejaValidator {
    static validate(data) {
        const errors = [];

        // Validar entidad_id
        if (!data.entidad_id) {
            errors.push('Debe seleccionar una entidad');
        } else if (isNaN(data.entidad_id) || parseInt(data.entidad_id) <= 0) {
            errors.push('Debe seleccionar una entidad válida');
        }

        // Validar descripción
        if (!data.descripcion) {
            errors.push('La descripción es requerida');
        } else {
            const descripcion = data.descripcion.trim();
            
            if (descripcion.length < 10) {
                errors.push('La descripción debe tener al menos 10 caracteres');
            }
            
            if (descripcion.length > 5000) {
                errors.push('La descripción no puede exceder 5000 caracteres');
            }

            // Validar que no sea solo espacios o caracteres especiales
            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(descripcion)) {
                errors.push('La descripción debe contener texto válido');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static sanitize(data) {
        return {
            entidad_id: parseInt(data.entidad_id),
            descripcion: data.descripcion ? data.descripcion.trim() : ''
        };
    }
}

// Validador para parámetros de consulta
class QueryValidator {
    static validatePagination(query) {
        const errors = [];
        const result = {
            limit: 50, // valor por defecto
            offset: 0  // valor por defecto
        };

        // Validar limit
        if (query.limit !== undefined) {
            const limit = parseInt(query.limit);
            if (isNaN(limit) || limit <= 0) {
                errors.push('El parámetro limit debe ser un número positivo');
            } else if (limit > 100) {
                errors.push('El parámetro limit no puede ser mayor a 100');
            } else {
                result.limit = limit;
            }
        }

        // Validar offset
        if (query.offset !== undefined) {
            const offset = parseInt(query.offset);
            if (isNaN(offset) || offset < 0) {
                errors.push('El parámetro offset debe ser un número no negativo');
            } else {
                result.offset = offset;
            }
        }

        // Calcular page si se proporciona
        if (query.page !== undefined) {
            const page = parseInt(query.page);
            if (isNaN(page) || page <= 0) {
                errors.push('El parámetro page debe ser un número positivo');
            } else {
                result.offset = (page - 1) * result.limit;
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            params: result
        };
    }

    static validateId(id) {
        const errors = [];
        const numericId = parseInt(id);

        if (isNaN(numericId) || numericId <= 0) {
            errors.push('El ID debe ser un número positivo válido');
        }

        return {
            isValid: errors.length === 0,
            errors,
            id: numericId
        };
    }
}

// Validador para filtros de búsqueda
class FilterValidator {
    static validateDateRange(query) {
        const errors = [];
        const result = {};

        if (query.fechaInicio) {
            const fechaInicio = new Date(query.fechaInicio);
            if (isNaN(fechaInicio.getTime())) {
                errors.push('Fecha de inicio inválida');
            } else {
                result.fechaInicio = fechaInicio;
            }
        }

        if (query.fechaFin) {
            const fechaFin = new Date(query.fechaFin);
            if (isNaN(fechaFin.getTime())) {
                errors.push('Fecha de fin inválida');
            } else {
                result.fechaFin = fechaFin;
            }
        }

        // Validar que fecha inicio sea anterior a fecha fin
        if (result.fechaInicio && result.fechaFin && result.fechaInicio > result.fechaFin) {
            errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        return {
            isValid: errors.length === 0,
            errors,
            dates: result
        };
    }
}

module.exports = {
    QuejaValidator,
    QueryValidator,
    FilterValidator
};
