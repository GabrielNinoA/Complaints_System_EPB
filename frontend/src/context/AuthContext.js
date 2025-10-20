import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLogged, setIsLogged] = useState(false);
    const [loading, setLoading] = useState(true);

    /**
     * Verifica el estado de autenticación al cargar
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * Verifica si hay un usuario logueado
     */
    const checkAuthStatus = async () => {
        const username = authService.getCurrentUser();
        
        if (!username) {
            setIsLogged(false);
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await authService.verifyUser(username);
            
            if (response.success && response.isLogged) {
                setUser(username);
                setIsLogged(true);
            } else {
                authService.clearCurrentUser();
                setUser(null);
                setIsLogged(false);
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            authService.clearCurrentUser();
            setUser(null);
            setIsLogged(false);
        }
        
        setLoading(false);
    };

    /**
     * Inicia sesión de un usuario
     */
    const login = async (username, password) => {
        try {
            const response = await authService.login(username, password);
            
            if (response.success) {
                authService.setCurrentUser(response.username);
                setUser(response.username);
                setIsLogged(true);
                return { success: true };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión' };
        }
    };

    /**
     * Cierra sesión del usuario actual
     */
    const logout = async () => {
        try {
            const username = authService.getCurrentUser();
            
            if (username) {
                await authService.logout(username);
            }
            
            authService.clearCurrentUser();
            setUser(null);
            setIsLogged(false);
            return { success: true };
        } catch (error) {
            console.error('Error en logout:', error);
            // Limpiar de todas formas
            authService.clearCurrentUser();
            setUser(null);
            setIsLogged(false);
            return { success: false, message: 'Error de conexión' };
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLogged, 
            loading, 
            login, 
            logout, 
            checkAuthStatus 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};
