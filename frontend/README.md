# Frontend - Sistema de Quejas y Reclamos

Este es el frontend moderno y reestructurado del Sistema de Quejas y Reclamos del Gobierno de Boyacá, construido con React 18 y las mejores prácticas de desarrollo.

## 🚀 Características

- **React 18** con hooks modernos
- **React Router v6** para navegación
- **React Query** para manejo de estado del servidor
- **React Hook Form** para formularios optimizados
- **Tailwind CSS** para estilos (mediante clases utilitarias custom)
- **Recharts** para gráficos y visualizaciones
- **Lucide React** para iconos
- **Axios** para peticiones HTTP
- **React Hot Toast** para notificaciones
- **date-fns** para manejo de fechas

## 📁 Estructura del Proyecto

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Alert.js
│   │   ├── Badge.js
│   │   ├── Layout.js
│   │   └── LoadingSpinner.js
│   ├── hooks/            # Custom hooks para React Query
│   │   ├── useEntidades.js
│   │   ├── useEstadisticas.js
│   │   └── useQuejas.js
│   ├── pages/            # Páginas principales
│   │   ├── ComplaintsList.js
│   │   ├── ConsultComplaints.js
│   │   ├── Home.js
│   │   ├── NotFound.js
│   │   ├── Reports.js
│   │   └── WriteComplaint.js
│   ├── services/         # Servicios API
│   │   └── api.js
│   ├── utils/            # Utilidades
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   └── validation.js
│   ├── App.js
│   ├── index.js
│   └── index.css
└── package.json
```

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del frontend:

```env
REACT_APP_API_URL=http://localhost:3001
```

Para producción (Render):
```env
REACT_APP_API_URL=https://tu-backend-url.onrender.com
```

### 3. Iniciar en desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm run lint` - Verifica el código con ESLint
- `npm run lint:fix` - Corrige automáticamente problemas de ESLint
- `npm run format` - Formatea el código con Prettier
- `npm run preview` - Construye y sirve una preview de producción

## 📱 Características del Frontend

### Componentes Principales

1. **Layout** - Estructura base con navegación y footer
2. **Home** - Página principal con estadísticas y acciones rápidas
3. **WriteComplaint** - Formulario para crear quejas con validación completa
4. **ConsultComplaints** - Consulta de quejas por número de radicado
5. **ComplaintsList** - Lista administrativa con filtros y paginación
6. **Reports** - Dashboards con gráficos y estadísticas

### Funcionalidades

- ✅ Navegación responsive con menú móvil
- ✅ Formularios con validación en tiempo real
- ✅ Gestión de estado del servidor con React Query
- ✅ Notificaciones toast para feedback al usuario
- ✅ Manejo de errores robusto
- ✅ Carga lazy y optimizaciones de rendimiento
- ✅ Diseño responsive para móviles y desktop
- ✅ Gráficos interactivos para reportes
- ✅ Exportación de datos a CSV
- ✅ Búsqueda y filtros avanzados

### Validaciones

El sistema incluye validaciones completas para:
- Emails válidos
- Números de teléfono
- Documentos de identidad
- Campos requeridos
- Longitud de textos
- Tipos de archivo permitidos

### Gestión de Estado

- **React Query** para datos del servidor (caché, sincronización, refetch)
- **React Hook Form** para estado de formularios
- **useState/useEffect** para estado local de componentes
- **Context API** disponible para estado global (si se necesita)

## 🎨 Estilos y Diseño

El frontend utiliza un sistema de design tokens con:

- **Colores**: Paleta consistente con variables CSS
- **Tipografía**: Fuente Inter de Google Fonts
- **Espaciado**: Sistema de espaciado basado en rem
- **Componentes**: Librería de componentes custom reutilizables
- **Responsive**: Mobile-first con breakpoints estándar
- **Accesibilidad**: Focus visible y navegación por teclado

## 🔧 Configuración de Producción

### Variables de Entorno para Render

```env
REACT_APP_API_URL=https://tu-backend-url.onrender.com
```

### Build para Producción

```bash
npm run build
```

Esto genera la carpeta `build/` optimizada para producción.

## 📊 Monitoreo y Analytics

El frontend está preparado para integrar:
- Google Analytics (configurar en `public/index.html`)
- Sentry para monitoreo de errores
- Performance monitoring
- User behavior tracking

## 🧪 Testing

Estructura preparada para testing con:
- Jest (incluido con Create React App)
- React Testing Library
- Testing de componentes
- Testing de hooks personalizados
- Testing de integración

## 🔒 Seguridad

Medidas de seguridad implementadas:
- Validación del lado del cliente (complementa backend)
- Sanitización de inputs
- Headers de seguridad (configurados en backend)
- HTTPS only en producción
- CSP (Content Security Policy) ready

## 📈 Performance

Optimizaciones incluidas:
- Code splitting automático
- Lazy loading de componentes
- Optimización de imágenes
- Service Worker para caché (opcional)
- Bundle size optimization

## 🔄 Integración con Backend

El frontend se conecta al backend mediante:
- API REST con axios
- Manejo automático de tokens (si se implementa auth)
- Retry automático en errores de red
- Timeout y manejo de errores
- Interceptors para logging

## 📞 Soporte

Para soporte técnico:
- Documentación en código
- README detallado
- Comentarios explicativos
- Estructura clara y mantenible

## 🚀 Deployment en Render

1. Conectar repositorio a Render
2. Configurar variables de entorno
3. Build command: `npm run build`
4. Publish directory: `build`
5. Auto-deploy configurado

El frontend está completamente preparado para producción y deployments automáticos.
