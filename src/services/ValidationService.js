/**
 * ValidationService - Clase única para manejar todas las validaciones del sistema
 * Centraliza toda la lógica de validación
 */
class ValidationService {
    
    // ==================== VALIDACIONES GENERALES ====================

    /**
     * Valida un ID numérico
     */
    validateId(id) {
        const errors = [];
        
        if (id === undefined || id === null || id === '') {
            errors.push('El ID es requerido');
            return { isValid: false, errors };
        }

        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId)) {
            errors.push('El ID debe ser un número válido');
        } else if (numericId <= 0) {
            errors.push('El ID debe ser mayor que 0');
        } else if (!Number.isInteger(numericId)) {
            errors.push('El ID debe ser un número entero');
        }

        return {
            isValid: errors.length === 0,
            errors,
            id: errors.length === 0 ? numericId : null
        };
    }

    /**
     * Valida parámetros de paginación
     */
    validatePagination(query) {
        const errors = [];
        let limit = parseInt(query.limit, 10);
        let offset = parseInt(query.offset, 10);

        if (isNaN(limit) || limit < 1) {
            limit = 10;
        }
        
        if (limit > 100) {
            errors.push('El límite no puede ser mayor a 100');
            limit = 100;
        }

        if (isNaN(offset) || offset < 0) {
            offset = 0;
        }

        return {
            isValid: errors.length === 0,
            errors,
            params: { limit, offset }
        };
    }

    /**
     * Valida un nombre
     */
    validateNombre(nombre) {
        const errors = [];
        
        if (!nombre || typeof nombre !== 'string') {
            errors.push('El nombre es requerido');
            return { isValid: false, errors };
        }

        const trimmedNombre = nombre.trim();

        if (trimmedNombre.length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (trimmedNombre.length > 255) {
            errors.push('El nombre no puede exceder 255 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors,
            value: trimmedNombre
        };
    }

    // ==================== VALIDACIONES PARA QUEJAS ====================

    /**
     * Valida los datos de una queja
     */
    validateQueja(data) {
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

            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(descripcion)) {
                errors.push('La descripción debe contener texto válido');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitiza los datos de una queja
     */
    sanitizeQueja(data) {
        return {
            entidad_id: parseInt(data.entidad_id),
            descripcion: data.descripcion ? data.descripcion.trim() : ''
        };
    }

    /**
     * Valida el estado de una queja
     */
    validateQuejaState(state) {
        const validStates = ['open', 'in process', 'closed'];
        const errors = [];

        if (!state) {
            errors.push('El estado es requerido');
        } else if (!validStates.includes(state)) {
            errors.push(`Estado inválido. Los estados válidos son: ${validStates.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            validStates
        };
    }

    // ==================== VALIDACIONES PARA COMENTARIOS ====================

    /**
     * Valida los datos de un comentario
     */
    validateComentario(data) {
        const errors = [];

        // Validar queja_id
        if (!data.queja_id) {
            errors.push('El ID de la queja es requerido');
        } else if (isNaN(data.queja_id) || parseInt(data.queja_id) <= 0) {
            errors.push('El ID de la queja debe ser válido');
        }

        // Validar texto
        if (!data.texto) {
            errors.push('El texto del comentario es requerido');
        } else {
            const texto = data.texto.trim();
            
            if (texto.length < 5) {
                errors.push('El comentario debe tener al menos 5 caracteres');
            }
            
            if (texto.length > 2000) {
                errors.push('El comentario no puede exceder 2000 caracteres');
            }

            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(texto)) {
                errors.push('El comentario debe contener texto válido');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitiza los datos de un comentario
     */
    sanitizeComentario(data) {
        return {
            queja_id: parseInt(data.queja_id),
            texto: data.texto ? data.texto.trim() : ''
        };
    }

    /**
     * Valida texto para actualización de comentario
     */
    validateComentarioUpdate(texto) {
        const errors = [];

        if (!texto) {
            errors.push('El texto del comentario es requerido');
        } else {
            const trimmedTexto = texto.trim();
            
            if (trimmedTexto.length < 5) {
                errors.push('El comentario debe tener al menos 5 caracteres');
            }
            
            if (trimmedTexto.length > 2000) {
                errors.push('El comentario no puede exceder 2000 caracteres');
            }

            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedTexto)) {
                errors.push('El comentario debe contener texto válido');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            value: texto ? texto.trim() : ''
        };
    }

    // ==================== VALIDACIONES PARA AUTENTICACIÓN ====================

    /**
     * Valida clave de administrador
     */
    validateAdminKey(providedKey, expectedKey) {
        const errors = [];

        if (!providedKey) {
            errors.push('Clave de administrador requerida');
        } else if (providedKey !== expectedKey) {
            errors.push('Clave de administrador incorrecta');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ==================== VALIDACIONES PARA ENTIDADES ====================

    /**
     * Valida si una entidad existe
     */
    validateEntidadExists(entidad) {
        if (!entidad) {
            return {
                isValid: false,
                errors: ['Entidad no encontrada']
            };
        }

        return {
            isValid: true,
            errors: []
        };
    }

    /**
     * Valida si una queja existe
     */
    validateQuejaExists(queja) {
        if (!queja) {
            return {
                isValid: false,
                errors: ['Queja no encontrada']
            };
        }

        return {
            isValid: true,
            errors: []
        };
    }

    /**
     * Valida si un comentario existe
     */
    validateComentarioExists(comentario) {
        if (!comentario) {
            return {
                isValid: false,
                errors: ['Comentario no encontrado']
            };
        }

        return {
            isValid: true,
            errors: []
        };
    }

    // ==================== VALIDACIONES PARA ESTADÍSTICAS ====================

    /**
     * Valida límite para consultas
     */
    validateLimit(limit, maxLimit = 100) {
        const errors = [];
        let validatedLimit = parseInt(limit, 10);

        if (isNaN(validatedLimit) || validatedLimit < 1) {
            validatedLimit = 12; // valor por defecto
        }

        if (validatedLimit > maxLimit) {
            errors.push(`El límite no puede ser mayor a ${maxLimit}`);
            validatedLimit = maxLimit;
        }

        return {
            isValid: errors.length === 0,
            errors,
            value: validatedLimit
        };
    }
}

module.exports = new ValidationService();
