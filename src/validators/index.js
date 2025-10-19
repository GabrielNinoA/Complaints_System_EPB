
const validationService = require('../services/ValidationService');

class QuejaValidator {
    static validate(data) {
        return validationService.validateQueja(data);
    }

    static sanitize(data) {
        return validationService.sanitizeQueja(data);
    }
}

class ComentarioValidator {
    static validate(data) {
        return validationService.validateComentario(data);
    }

    static sanitize(data) {
        return validationService.sanitizeComentario(data);
    }
}

class QueryValidator {
    static validatePagination(query) {
        return validationService.validatePagination(query);
    }

    static validateId(id) {
        return validationService.validateId(id);
    }
}

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