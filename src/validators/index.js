// Validador para datos de quejas
class QuejaValidator {
    static validate(data) {
        const errors = [];

        if (!data.entidad_id) {
            errors.push('Debe seleccionar una entidad');
        } else if (isNaN(data.entidad_id) || parseInt(data.entidad_id) <= 0) {
            errors.push('Debe seleccionar una entidad válida');
        }

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

// Validador para comentarios
class ComentarioValidator {
    static validate(data) {
        const errors = [];

        if (!data.queja_id) {
            errors.push('El ID de la queja es requerido');
        } else if (isNaN(data.queja_id) || parseInt(data.queja_id) <= 0) {
            errors.push('El ID de la queja debe ser válido');
        }

        if (!data.texto) {
            errors.push('El texto del comentario es requerido');
        } else {
            const texto = data.texto.trim();
            
            if (texto.length < 5) {
                errors.push('El comentario debe tener al menos 5 caracteres');
            }
            
            if (texto.length > 1000) {
                errors.push('El comentario no puede exceder 1000 caracteres');
            }

            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(texto)) {
                errors.push('El comentario debe contener texto válido');
            }
        }

        if (data.fecha) {
            const fecha = new Date(data.fecha);
            if (isNaN(fecha.getTime())) {
                errors.push('La fecha proporcionada no es válida');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static sanitize(data) {
        const sanitized = {
            queja_id: parseInt(data.queja_id),
            texto: data.texto ? data.texto.trim() : ''
        };

        if (data.fecha) {
            sanitized.fecha = new Date(data.fecha);
        }

        return sanitized;
    }
}

// Validador para parámetros de consulta
class QueryValidator {
    static validatePagination(query) {
        const errors = [];
        const result = {
            limit: 50,
            offset: 0
        };

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

        if (query.offset !== undefined) {
            const offset = parseInt(query.offset);
            if (isNaN(offset) || offset < 0) {
                errors.push('El parámetro offset debe ser un número no negativo');
            } else {
                result.offset = offset;
            }
        }

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
    ComentarioValidator,
    QueryValidator,
    FilterValidator
};