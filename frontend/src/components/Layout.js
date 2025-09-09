import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Importar iconos directamente desde src/assets
import iconSearch from '../assets/icon-search.png';
import iconWrite from '../assets/icon-write.png';
import iconCheck from '../assets/icon-check.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems = [
    { 
      path: '/consultar-quejas', 
      label: 'Consultar quejas', 
      key: 'consultar',
      icon: iconSearch
    },
    { 
      path: '/escribir-queja', 
      label: 'Escribir queja', 
      key: 'escribir',
      icon: iconWrite
    },
    { 
      path: '/reportes', 
      label: 'Generar reporte', 
      key: 'reportes',
      icon: iconCheck
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
      </header>

      {/* Sidebar Menu */}
      <div className={`sidebar ${isMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <nav className="nav-menu">
          {menuItems.map((item) => (
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
          ))}
        </nav>
      </div>
      
      <main className={`main-content ${isMenuOpen ? 'content-shifted' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
