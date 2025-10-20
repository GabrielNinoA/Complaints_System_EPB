const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Servicio de autenticación para comunicarse con el microservicio
 */
export const authService = {
    /**
     * Realiza el login de un usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Respuesta del servidor
     */
    async login(username, password) {
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor de autenticación'
            };
        }
    },

    /**
     * Realiza el logout de un usuario
     * @param {string} username - Nombre de usuario
     * @returns {Promise<Object>} Respuesta del servidor
     */
    async logout(username) {
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            return await response.json();
        } catch (error) {
            console.error('Error en logout:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor de autenticación'
            };
        }
    },

    /**
     * Verifica si un usuario está logueado
     * @param {string} username - Nombre de usuario
     * @returns {Promise<Object>} Estado del usuario
     */
    async verifyUser(username) {
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/auth/verify/${username}`);
            return await response.json();
        } catch (error) {
            console.error('Error verificando usuario:', error);
            return {
                success: false,
                isLogged: false,
                message: 'Error de conexión con el servidor de autenticación'
            };
        }
    },

    /**
     * Obtiene el usuario actual del localStorage
     * @returns {string|null} Username o null
     */
    getCurrentUser() {
        return localStorage.getItem('username');
    },

    /**
     * Guarda el usuario en localStorage
     * @param {string} username - Nombre de usuario
     */
    setCurrentUser(username) {
        localStorage.setItem('username', username);
    },

    /**
     * Elimina el usuario del localStorage
     */
    clearCurrentUser() {
        localStorage.removeItem('username');
    }
};