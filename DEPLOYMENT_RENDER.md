# 🚀 Deployment en Render - Sistema de Quejas Boyacá

Este documento describe cómo hacer deployment de la aplicación completa (backend + frontend) en Render como un servicio único.

## 📋 Pre-requisitos

- ✅ Repositorio en GitHub con el código
- ✅ Base de datos MySQL en Clever Cloud configurada
- ✅ Cuenta en Render

## 🔧 Configuración Local Antes del Deploy

### 1. Verificar que todos los archivos estén listos:

```bash
# Verificar estructura del proyecto
proyecto/
├── server.js                 # Servidor backend configurado
├── package.json              # Scripts de build configurados
├── render.yaml               # Configuración de Render
├── CONFIGURACION_RENDER.txt  # Guía paso a paso
├── frontend/
│   ├── package.json          # Scripts de React configurados
│   ├── .env                  # Variables para desarrollo
│   └── .env.production       # Variables para producción
└── src/                      # Código del backend
```

### 2. Probar el build localmente:

```bash
# Instalar dependencias del backend
npm install

# Hacer build del frontend
npm run build

# Iniciar en modo producción (opcional)
NODE_ENV=production npm start
```

## 🌐 Deployment en Render

### Opción A: Usando render.yaml (Recomendado)

1. **Subir código a GitHub**:
   ```bash
   git add .
   git commit -m "Preparar para deployment en Render"
   git push origin main
   ```

2. **Crear servicio en Render**:
   - Ve a [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Conecta tu repositorio
   - Render detectará automáticamente el `render.yaml`

3. **¡Deploy automático!** 🎉
   - Render configurará todo según el `render.yaml`
   - Las variables de entorno se configurarán automáticamente
   - El build y deployment se ejecutarán

### Opción B: Configuración Manual

Si prefieres configurar manualmente (o si render.yaml no funciona):

1. **Configuración básica**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Region**: Oregon (US West)

2. **Variables de entorno** (ver `CONFIGURACION_RENDER.txt` para lista completa):
   ```
   NODE_ENV=production
   PORT=3000
   MYSQL_ADDON_HOST=bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com
   # ... (agregar todas las variables de la base de datos)
   ```

## 🔍 Verificación del Deployment

Una vez desplegado, verifica que todo funcione:

### 1. URLs importantes:
- **Aplicación**: `https://tu-servicio.onrender.com/app`
- **API**: `https://tu-servicio.onrender.com/api`
- **Health Check**: `https://tu-servicio.onrender.com/health`

### 2. Pruebas básicas:
```bash
# Health check
curl https://tu-servicio.onrender.com/health

# API de entidades
curl https://tu-servicio.onrender.com/api/entidades

# Frontend (debería mostrar la aplicación React)
# Visitar en el navegador: https://tu-servicio.onrender.com/app
```

## 🐛 Solución de Problemas

### Build falla:
- Revisar logs en Render
- Verificar que `package.json` tenga todas las dependencias
- Confirmar que `npm run build` funcione localmente

### App no carga:
- Verificar variables de entorno en Render
- Confirmar que `NODE_ENV=production`
- Revisar logs del servidor

### Base de datos no conecta:
- Verificar credenciales de Clever Cloud
- Confirmar que todas las variables `MYSQL_ADDON_*` estén configuradas
- Probar conexión desde los logs

### Frontend no se sirve:
- Verificar que se generó `frontend/build/`
- Confirmar configuración de archivos estáticos en `server.js`
- Revisar rutas en el navegador (deben empezar con `/app`)

## 📁 Archivos Importantes

- **`render.yaml`**: Configuración declarativa de Render
- **`server.js`**: Servidor que sirve API + archivos estáticos
- **`CONFIGURACION_RENDER.txt`**: Guía detallada paso a paso
- **`package.json`**: Scripts de build y dependencias
- **`frontend/.env.production`**: Variables del frontend en producción

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Antes de deployment en producción:

1. **Cambiar claves secretas**:
   ```bash
   # Generar claves seguras
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Actualizar variables en Render**:
   - `JWT_SECRET`: Nueva clave generada
   - `SESSION_SECRET`: Nueva clave generada

3. **Revisar configuración de email** si planeas usarlo

## 📞 Soporte

Si tienes problemas con el deployment:

1. Revisa `CONFIGURACION_RENDER.txt` para pasos detallados
2. Consulta los logs en Render dashboard
3. Verifica que la configuración local funcione primero

---

✨ **¡Tu aplicación estará disponible en una URL como**: `https://sistema-quejas-boyaca.onrender.com/app`
