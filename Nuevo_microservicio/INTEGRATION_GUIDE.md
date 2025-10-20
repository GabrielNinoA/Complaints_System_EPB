# 🔗 Guía de Integración del Microservicio de Autenticación

Esta guía explica cómo integrar el microservicio de autenticación en la aplicación principal del Sistema de Quejas EPB.

## 📍 URL del Microservicio

**Desarrollo local:** `http://localhost:3001`  
**Producción (Render):** `https://tu-microservicio.onrender.com`

---

## 🎯 Flujo de Integración

### 1. Configuración en Frontend

Agregar la URL del microservicio en el archivo de configuración:

```javascript
// frontend/src/config/config.js
export const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';
```

Y en el `.env` del frontend:
```env
REACT_APP_AUTH_SERVICE_URL=https://tu-microservicio.onrender.com
```

---

### 2. Servicio de Autenticación en Frontend

Crear un servicio para comunicarse con el microservicio:

```javascript
// frontend/src/services/authService.js
import { AUTH_SERVICE_URL } from '../config/config';

export const authService = {
    // Login de usuario
    async login(username, password) {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    },

    // Logout de usuario
    async logout(username) {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return response.json();
    },

    // Verificar estado de usuario
    async verifyUser(username) {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/verify/${username}`);
        return response.json();
    },

    // Obtener usuario del localStorage
    getCurrentUser() {
        return localStorage.getItem('username');
    },

    // Guardar usuario en localStorage
    setCurrentUser(username) {
        localStorage.setItem('username', username);
    },

    // Eliminar usuario del localStorage
    clearCurrentUser() {
        localStorage.removeItem('username');
    }
};
```

---

### 3. Context para Gestión de Estado de Autenticación

```javascript
// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLogged, setIsLogged] = useState(false);
    const [loading, setLoading] = useState(true);

    // Verificar estado de usuario al cargar
    useEffect(() => {
        checkAuthStatus();
    }, []);

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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};
```

---

### 4. Modificar Layout.js para incluir botón de login

```javascript
// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isLogged, logout } = useAuth();

  const menuItems = [
    { 
      path: '/consultar-quejas', 
      label: 'Consultar quejas', 
      key: 'consultar',
      icon: iconSearch,
      requiresAuth: true  // Nueva propiedad
    },
    { 
      path: '/escribir-queja', 
      label: 'Escribir queja', 
      key: 'escribir',
      icon: iconWrite,
      requiresAuth: false
    },
    { 
      path: '/reportes', 
      label: 'Generar reporte', 
      key: 'reportes',
      icon: iconCheck,
      requiresAuth: false
    }
  ];

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <button className="menu-toggle" onClick={toggleMenu}>
          <div className="hamburger-icon">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
          <span className="menu-text">Menu</span>
        </button>
        
        <h1 className="header-title">
          Quejas de las entidades públicas de Boyacá
        </h1>

        {/* Botón de Login/Logout */}
        <div className="auth-section">
          {isLogged ? (
            <div className="user-info">
              <span className="status-indicator active"></span>
              <span className="username">{user}</span>
              <button onClick={handleLogout} className="logout-btn">
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="login-btn">
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Sidebar Menu */}
      <div className={`sidebar ${isMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <nav className="nav-menu">
          {menuItems.map((item) => {
            // Ocultar items que requieren autenticación si no está logueado
            if (item.requiresAuth && !isLogged) {
              return null;
            }

            return (
              <div
                key={item.key}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <img src={item.icon} alt={item.label} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
      
      <main className={`main-content ${isMenuOpen ? 'content-shifted' : ''}`}>
        {children}
      </main>

      {/* Modal de Login */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default Layout;
```

---

### 5. Validación en Backend Principal

Modificar los controladores de quejas para validar con el microservicio:

```javascript
// src/controllers/quejasController.js
const fetch = require('node-fetch'); // O usar axios

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Método auxiliar para verificar autenticación
async function verifyUserAuthentication(username) {
    if (!username) {
        return { isLogged: false };
    }

    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/verify/${username}`);
        const data = await response.json();
        return data.success ? { isLogged: data.isLogged } : { isLogged: false };
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        return { isLogged: false };
    }
}

// Ejemplo: DELETE de queja
async deleteQueja(req, res) {
    try {
        const { username } = req.body; // Ahora recibe username en lugar de adminKey
        
        // Verificar que el usuario esté logueado
        const authStatus = await verifyUserAuthentication(username);
        
        if (!authStatus.isLogged) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado. Debe iniciar sesión como administrador.'
            });
        }

        // Continuar con la lógica de eliminación...
        // ...
    } catch (error) {
        // ...
    }
}
```

---

## 🔧 Variables de Entorno Necesarias

### En el proyecto principal:
```env
AUTH_SERVICE_URL=https://tu-microservicio.onrender.com
```

### En el microservicio:
```env
NODE_ENV=production
AUTH_SERVICE_PORT=3001
MYSQL_ADDON_DB=tu_base_de_datos
MYSQL_ADDON_HOST=tu_host
MYSQL_ADDON_PASSWORD=tu_password
MYSQL_ADDON_PORT=tu_puerto
MYSQL_ADDON_USER=tu_usuario
```

---

## ✅ Checklist de Integración

- [ ] Microservicio desplegado en Render
- [ ] Variables de entorno configuradas
- [ ] AuthContext implementado en frontend
- [ ] LoginModal creado
- [ ] Layout modificado con botón de login
- [ ] Rutas protegidas implementadas
- [ ] Backend validando con microservicio
- [ ] Persistencia en localStorage funcionando
- [ ] Redirección al cerrar sesión funcionando
- [ ] Pruebas de integración completadas

---

## 🐛 Solución de Problemas

### El microservicio no responde
- Verificar que el microservicio esté corriendo
- Revisar la URL en las variables de entorno
- Verificar conectividad de red

### El usuario no persiste al recargar
- Verificar que localStorage esté guardando el username
- Verificar que checkAuthStatus se ejecute al montar el componente

---

## 📚 Recursos Adicionales

- [Documentación de React Context](https://reactjs.org/docs/context.html)
- [LocalStorage API](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage)
- [Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)
