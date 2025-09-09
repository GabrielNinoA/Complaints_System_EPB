# Sistema de Quejas Boyacá v2.0 - Backend Reestructurado

Este directorio contiene la versión reestructurada del Sistema de Gestión de Quejas para entidades públicas de Boyacá.

## 🏗️ Arquitectura del Backend

### Tecnologías Utilizadas
- **Node.js v18+** - Runtime
- **Express.js v4.18+** - Framework web
- **MySQL2 v3.6+** - Cliente MySQL con pool de conexiones
- **Clever Cloud MySQL** - Base de datos en la nube
- **Render** - Hosting y deployment

### Estructura del Proyecto
```
src/
├── config/          # Configuraciones (DB, etc.)
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware customizado
├── routes/          # Definición de rutas
├── services/        # Servicios (DB, etc.)
└── validators/      # Validaciones de datos
```

## 🗄️ Configuración de Base de Datos

### Prerrequisitos
- MySQL Client instalado en tu sistema
- Acceso a internet para conectar con Clever Cloud
- Variables de entorno configuradas en el archivo `.env`

### 🚀 Instalación Automática de Base de Datos

Para crear automáticamente las tablas y cargar las entidades iniciales en la base de datos de Clever Cloud, ejecuta el siguiente comando:

```bash
Get-Content database-setup.sql | mysql -h Host_DB -P port -u user_DB -ppassword_DB
```

### 📋 Explicación del comando:

- `-h`: Host de la base de datos
- `-P`: Puerto de conexión
- `-u`: Usuario de la base de datos
- `-p`: Contraseña (sin espacio después de -p)
- `Get-Content`: Archivo SQL a ejecutar

### ✅ Verificación

Después de ejecutar el comando, deberías ver:
- Confirmación de creación de tablas
- Lista de entidades insertadas
- Estructura de las tablas creadas

## 🚀 Instalación y Desarrollo

### Instalación de dependencias
```bash
npm install
```

### Variables de entorno
Copia las variables del archivo `.env` a tu entorno o plataforma de deployment.

### Desarrollo local
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 API Endpoints

### Entidades
- `GET /api/entidades` - Obtener todas las entidades
- `GET /api/entidades/:id` - Obtener entidad por ID
- `GET /api/entidades/search?nombre=` - Buscar entidad por nombre

### Quejas
- `GET /api/quejas` - Obtener todas las quejas (con paginación)
- `GET /api/quejas/:id` - Obtener queja por ID
- `POST /api/quejas` - Crear nueva queja
- `GET /api/quejas/entidad/:entidadId` - Quejas por entidad
- `DELETE /api/quejas/:id` - Eliminar queja (admin)

### Estadísticas
- `GET /api/estadisticas` - Estadísticas generales
- `GET /api/estadisticas/entidades` - Distribución por entidad
- `GET /api/estadisticas/tendencia` - Tendencia mensual
- `GET /api/estadisticas/reporte` - Reporte completo

### Utilidades
- `GET /health` - Health check básico
- `GET /api/health` - Health check completo con DB
- `GET /api/docs` - Documentación de la API

## 🔧 Características Técnicas

### Seguridad
- Rate limiting configurable por endpoint
- Helmet para headers de seguridad
- CORS configurado para producción
- Validación de entrada robusta
- Logging de operaciones

### Performance
- Pool de conexiones MySQL
- Compresión gzip
- Paginación en consultas grandes
- Queries optimizadas con índices

### Monitoreo
- Health checks automáticos
- Logging estructurado
- Métricas de tiempo de respuesta
- Manejo graceful de errores

### Deployment en Render
- Configurado para web service nativo
- Variables de entorno desde dashboard
- Auto-deployment desde git
- Logs centralizados
