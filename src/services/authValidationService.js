const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

/**
 * Servicio para validar autenticación con el microservicio
 */
class AuthValidationService {
    /**
     * Verifica si un usuario está autenticado consultando el microservicio
     * @param {string} username - Nombre de usuario a verificar
     * @returns {Promise<Object>} Estado de autenticación
     */
    async verifyUserAuthentication(username) {
        if (!username) {
            return { 
                isLogged: false, 
                message: 'Username no proporcionado' 
            };
        }

        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/auth/verify/${username}`);
            const data = await response.json();

            if (data.success && data.isLogged) {
                return { 
                    isLogged: true, 
                    username: data.username 
                };
            }

            return { 
                isLogged: false, 
                message: 'Usuario no está autenticado' 
            };
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error.message);
            return { 
                isLogged: false, 
                message: 'Error de conexión con el servicio de autenticación' 
            };
        }
    }

    /**
     * Valida que un usuario esté autenticado antes de permitir una operación
     * @param {string} username - Nombre de usuario a validar
     * @returns {Promise<Object>} Resultado de validación
     */
    async validateAuthForOperation(username) {
        const authStatus = await this.verifyUserAuthentication(username);

        if (!authStatus.isLogged) {
            return {
                isValid: false,
                statusCode: 403,
                message: 'No autorizado. Debe iniciar sesión como administrador.'
            };
        }

        return {
            isValid: true,
            username: authStatus.username
        };
    }
}

module.exports = new AuthValidationService();