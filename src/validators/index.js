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

// Validador para comentarios
class ComentarioValidator {
    static validate(data) {
        const errors = [];

        // Validar queja_id
        if (!data.queja_id) {
            errors.push('ID de queja es requerido');
        } else if (isNaN(data.queja_id) || parseInt(data.queja_id) <= 0) {
            errors.push('ID de queja debe ser un número válido');
        }

        // Validar texto
        const textValidation = this.validateTexto(data.texto);
        if (!textValidation.isValid) {
            errors.push(...textValidation.errors);
        }

        // Validar fecha_comentario (opcional)
        if (data.fecha_comentario) {
            const fecha = new Date(data.fecha_comentario);
            if (isNaN(fecha.getTime())) {
                errors.push('Fecha de comentario inválida');
            } else {
                // No permitir fechas futuras
                const ahora = new Date();
                if (fecha > ahora) {
                    errors.push('La fecha del comentario no puede ser futura');
                }
                
                // No permitir fechas muy antiguas (más de 1 año)
                const unAnoAtras = new Date();
                unAnoAtras.setFullYear(unAnoAtras.getFullYear() - 1);
                if (fecha < unAnoAtras) {
                    errors.push('La fecha del comentario no puede ser anterior a un año');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateTexto(texto) {
        const errors = [];

        if (!texto) {
            errors.push('El texto del comentario es requerido');
        } else {
            const textoLimpio = texto.trim();
            
            if (textoLimpio.length < 3) {
                errors.push('El comentario debe tener al menos 3 caracteres');
            }
            
            if (textoLimpio.length > 2000) {
                errors.push('El comentario no puede exceder 2000 caracteres');
            }

            // Validar que no sea solo espacios o caracteres especiales
            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(textoLimpio)) {
                errors.push('El comentario debe contener texto válido');
            }

            // Validar que no contenga solo caracteres repetidos
            if (textoLimpio.length > 5) {
                const primerCaracter = textoLimpio[0];
                const todoIgual = textoLimpio.split('').every(char => char === primerCaracter);
                if (todoIgual) {
                    errors.push('El comentario no puede contener solo caracteres repetidos');
                }
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

        // Agregar fecha_comentario si se proporciona
        if (data.fecha_comentario) {
            const fecha = new Date(data.fecha_comentario);
            if (!isNaN(fecha.getTime())) {
                sanitized.fecha_comentario = fecha;
            }
        }

        return sanitized;
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

        // Validar que el rango no sea mayor a 1 año
        if (result.fechaInicio && result.fechaFin) {
            const diffTime = Math.abs(result.fechaFin - result.fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 365) {
                errors.push('El rango de fechas no puede ser mayor a 1 año');
            }
        }

        // Validar que las fechas no sean futuras
        const ahora = new Date();
        if (result.fechaInicio && result.fechaInicio > ahora) {
            errors.push('La fecha de inicio no puede ser futura');
        }
        if (result.fechaFin && result.fechaFin > ahora) {
            errors.push('La fecha de fin no puede ser futura');
        }

        return {
            isValid: errors.length === 0,
            errors,
            dates: result
        };
    }

    static validateSearchTerm(searchTerm) {
        const errors = [];
        const result = {};

        if (searchTerm) {
            const term = searchTerm.trim();
            
            if (term.length < 2) {
                errors.push('El término de búsqueda debe tener al menos 2 caracteres');
            } else if (term.length > 100) {
                errors.push('El término de búsqueda no puede exceder 100 caracteres');
            } else {
                result.searchTerm = term;
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            search: result
        };
    }
}

module.exports = {
    QuejaValidator,
    ComentarioValidator,
    QueryValidator,
    FilterValidator
};