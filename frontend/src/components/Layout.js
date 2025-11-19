import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
// Importar iconos directamente desde src/assets
import iconSearch from '../assets/icon-search.png';
import iconWrite from '../assets/icon-write.png';
import iconCheck from '../assets/icon-check.png';

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
      requiresAuth: true
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
    },
    { 
      path: '/historial', 
      label: 'Historial de Auditoría', 
      key: 'historial',
      icon: iconCheck,
      requiresAuth: false
    }
  ];

  const isActive = (path) => {
    if (path === '/consultar-quejas' && location.pathname.startsWith('/quejas/')) {
      return true;
    }
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
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

        {/* Sección de autenticación */}
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
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className="nav-icon"
                />
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
