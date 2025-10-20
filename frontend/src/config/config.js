// Configuración de la API para diferentes entornos
const config = {
  // URL de la API
  API_URL: process.env.REACT_APP_API_URL || (
    // En producción, usar la misma URL del frontend (rutas relativas)
    process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  ),
  
  // URL del microservicio de autenticación
  AUTH_SERVICE_URL: 'https://autenticator-complaint-system-epb.onrender.com',
  
  // Configuración de la aplicación
  APP_NAME: 'Sistema de Quejas Boyacá',
  VERSION: '2.1.0',
  
  // Configuración del entorno
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

export default config;
