```bash
src/
├── config/          # Configuraciones (DB, etc.)
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware customizado
├── routes/          # Definición de rutas
├── services/        # Servicios (DB, etc.)
└── validators/      # Validaciones de datos
```
# Sistema de Quejas Boyacá v2.2

Sistema web para la gestión de quejas y reclamos de entidades públicas de Boyacá con **sistema de auditoría en tiempo real usando Apache Kafka**.

---

## ✨ Características Principales

- 📝 Gestión completa de quejas y reclamos
- 🏢 Administración de entidades públicas
- 💬 Sistema de comentarios y seguimiento
- 📊 Reportes y estadísticas detalladas
- 🔍 **Sistema de auditoría con Kafka** (Registro histórico de todas las acciones)
- 👁️ **Auditoría de consultas** (Registro de accesos READ)
- 📈 **Dashboard de auditoría** en tiempo real
- 🔒 Autenticación y autorización
- 📱 Interfaz responsive

---

## 🆕 Sistema de Auditoría con Kafka

El sistema incluye un **registro histórico completo** de todas las acciones usando **Apache Kafka** como intermediario de mensajes.

### Características del Sistema de Auditoría:

- ✅ **Registro automático**: CREATE, UPDATE, DELETE y READ
- ✅ **Kafka como broker**: Eventos enviados primero a Kafka
- ✅ **Consumer persistente**: Guarda registros en MySQL
- ✅ **API de consulta**: Endpoints con filtros avanzados
- ✅ **Dashboard visual**: Vista en tiempo real del historial
- ✅ **Estadísticas**: Métricas del consumer y tasa de éxito

### Tipos de Acciones Auditadas:

- 🆕 **CREATE**: Creación de quejas, entidades, comentarios
- ✏️ **UPDATE**: Actualización de registros
- 🗑️ **DELETE**: Eliminación de registros
- 👁️ **READ**: Consultas a entidades

### Documentación Completa:

- 📖 [Guía completa del sistema de auditoría](./KAFKA-AUDIT-SYSTEM.md)
- 🚀 [Guía de inicio rápido](./KAFKA-QUICKSTART.md)

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js v18+** - Runtime de JavaScript
- **Express v4.18+** - Framework web
- **MySQL2 v3.6+** - Cliente de base de datos
- **KafkaJS v2.2+** - Cliente de Apache Kafka
- **Nodemailer** - Envío de correos electrónicos
- **Morgan** - Logger HTTP

### Infraestructura
- **Apache Kafka** - Sistema de mensajería distribuida
- **Zookeeper** - Coordinación de Kafka
- **Docker & Docker Compose** - Contenedores para Kafka
- **Clever Cloud** - Hosting de base de datos MySQL
- **MySQL 8.0** - Base de datos relacional

### Frontend
- **React v18+** - Librería UI
- **React Router v6+** - Enrutamiento
- **Fetch API** - Peticiones HTTP

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- ✅ [Node.js v18+](https://nodejs.org/) y npm v9+
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop) (para Kafka)
- ✅ [Git](https://git-scm.com/)
- ✅ Cuenta en [Clever Cloud](https://www.clever-cloud.com/) (base de datos MySQL)

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/GabrielNinoA/Complaints_System_EPB.git
cd Complaints_System_EPB
```

### 2. Configurar Base de Datos en Clever Cloud

#### 2.1 Crear Base de Datos MySQL

1. Inicia sesión en [Clever Cloud](https://console.clever-cloud.com/)
2. Crea un nuevo add-on de MySQL
3. Obtén las credenciales de conexión:
   - Host (ej: `bcfr5lpo90chdjajpbfu-mysql.services.clever-cloud.com`)
   - Puerto (ej: `20538`)
   - Usuario
   - Contraseña
   - Nombre de la base de datos

#### 2.2 Ejecutar Script de Base de Datos

**En Windows PowerShell:**
```powershell
Get-Content database-setup.sql | mysql -h <host> -P <puerto> -u <usuario> -p<contraseña> <nombre_db>
```

**En Linux/Mac:**
```bash
mysql -h <host> -P <puerto> -u <usuario> -p<contraseña> <nombre_db> < database-setup.sql
```

**Alternativa con MySQL Workbench:**
1. Abre MySQL Workbench
2. Conecta a tu base de datos de Clever Cloud
3. Abre el archivo `database-setup.sql`
4. Ejecuta el script completo

#### 2.3 Verificar Tablas Creadas

El script crea las siguientes tablas:
- `entidades` - Entidades públicas de Boyacá
- `quejas` - Registro de quejas
- `comentarios` - Comentarios de seguimiento
- `historial_acciones` - **Nueva**: Auditoría completa

### 3. Configurar Kafka con Docker

#### 3.1 Iniciar Kafka y Zookeeper

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

#### 3.2 Verificar que Kafka esté corriendo

```bash
# Ver contenedores activos
docker ps

# Deberías ver:
# - zookeeper (puerto 2181)
# - kafka (puerto 9092)
```

#### 3.3 Ver logs de Kafka (opcional)

```bash
docker-compose logs -f kafka
```

### 4. Configurar Variables de Entorno

#### 4.1 Backend (.env en la raíz)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de Datos MySQL (Clever Cloud)
DB_HOST=bcfr5lpo90chdjajpbfu-mysql.services.clever-cloud.com
DB_PORT=20538
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=bcfr5lpo90chdjajpbfu

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Kafka (Sistema de Auditoría)
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=complaints-system-epb
KAFKA_TOPIC_AUDIT=audit-events
KAFKA_CONSUMER_GROUP=audit-consumer-group

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_aplicacion
EMAIL_FROM=Sistema Quejas Boyacá <tu_correo@gmail.com>

# CORS
CORS_ORIGIN=http://localhost:3001
```

#### 4.2 Frontend (.env en /frontend)

Crea un archivo `.env` en la carpeta `frontend/`:

```env
# URL del Backend
REACT_APP_API_URL=http://localhost:3000
```

### 5. Instalar Dependencias

#### Backend
```bash
npm install
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

---

## ▶️ Ejecutar el Proyecto

### Modo Desarrollo (Local)

#### Opción 1: Usando dos terminales

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

#### Opción 2: Script único (si lo configuras)

Puedes agregar un script en `package.json` para iniciar ambos:

```json
"scripts": {
  "start": "node server.js",
  "dev": "concurrently \"npm start\" \"cd frontend && npm start\"",
  "client": "cd frontend && npm start"
}
```

### URLs de Acceso

Una vez iniciado:

- 🌐 **Frontend**: http://localhost:3001
- 🔧 **Backend API**: http://localhost:3000/api
- 💚 **Health Check**: http://localhost:3000/health
- 📊 **Historial de Auditoría**: http://localhost:3001/historial

### Verificar Sistema de Auditoría

1. Abre http://localhost:3001
2. Crea una queja o consulta una entidad
3. Ve a **Historial de Auditoría** en el menú
4. Deberías ver los registros de las acciones realizadas

---

## 🐳 Gestión de Docker/Kafka

### Comandos Útiles

```bash
# Iniciar Kafka
docker-compose up -d

# Detener Kafka
docker-compose down

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar Kafka
docker-compose restart

# Eliminar contenedores y volúmenes
docker-compose down -v
```

### Verificar Topics de Kafka

```bash
# Entrar al contenedor de Kafka
docker exec -it kafka bash

# Listar topics
kafka-topics --bootstrap-server localhost:9092 --list

# Ver mensajes del topic de auditoría
kafka-console-consumer --bootstrap-server localhost:9092 --topic audit-events --from-beginning
```

---

## 📁 Estructura del Proyecto

```
Complaints_System_EPB/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración MySQL
│   │   └── kafka.js             # Configuración Kafka
│   ├── controllers/
│   │   ├── quejasController.js  # Lógica de quejas
│   │   ├── entidadesController.js
│   │   ├── comentariosController.js
│   │   └── historialController.js  # API de auditoría
│   ├── services/
│   │   ├── database.js          # Servicio MySQL
│   │   ├── kafkaProducer.js     # Envío a Kafka
│   │   ├── kafkaConsumer.js     # Consumo desde Kafka
│   │   └── auditService.js      # Servicio de auditoría
│   ├── middleware/
│   │   ├── logger.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   └── api.js               # Rutas de la API
│   └── validators/
│       └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── WriteComplaint.js
│   │   │   ├── ConsultComplaints.js
│   │   │   ├── ComplaintsList.js
│   │   │   ├── Reports.js
│   │   │   └── AuditHistory.js    # Dashboard de auditoría
│   │   ├── services/
│   │   └── context/
│   ├── public/
│   └── package.json
├── scripts/
│   ├── init-db.js               # Script de inicialización
│   └── health-check.js
├── docker-compose.yml           # Kafka + Zookeeper
├── database-setup.sql           # Script de BD
├── server.js                    # Servidor principal
├── package.json
└── README.md
```
---

## 🔧 Solución de Problemas

### Kafka no se conecta

```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar Kafka
docker-compose restart

# Ver logs de errores
docker-compose logs kafka
```

### Error de conexión a MySQL

- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que la IP de tu máquina esté permitida en Clever Cloud
- Prueba la conexión con MySQL Workbench

### Puerto 3000 o 3001 en uso

```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### El Consumer no procesa eventos

```bash
# Verificar logs del backend
# Deberías ver: "✅ Kafka Consumer iniciado y escuchando eventos"

# Verificar que el topic existe
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## 📊 Endpoints de la API

### Quejas
- `GET /api/quejas` - Listar todas las quejas
- `GET /api/quejas/:id` - Obtener queja por ID
- `POST /api/quejas` - Crear nueva queja
- `PUT /api/quejas/:id` - Actualizar queja
- `DELETE /api/quejas/:id` - Eliminar queja

### Entidades
- `GET /api/entidades` - Listar todas las entidades
- `GET /api/entidades/:id` - Obtener entidad por ID
- `GET /api/entidades/buscar?nombre=X` - Buscar por nombre

### Historial de Auditoría (Nuevo)
- `GET /api/historial` - Listar historial con filtros
- `GET /api/historial/stats` - Estadísticas generales
- `GET /api/historial/consumer/stats` - Estado del consumer
- `GET /api/historial/:entidad/:id` - Historial de un registro

### Parámetros de Filtrado (Historial)
- `?limit=20` - Cantidad de registros (max: 200)
- `?offset=0` - Paginación
- `?tipoAccion=CREATE|UPDATE|DELETE|READ` - Filtrar por tipo
- `?entidadAfectada=quejas|entidades|comentarios` - Filtrar por entidad

---

## 🌐 Despliegue en Producción

### Opción 1: Render (Recomendado para Backend)

1. Sube el proyecto a GitHub
2. Crea un nuevo Web Service en [Render](https://render.com/)
3. Configuración:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Añade las variables de entorno (`.env`)
5. Para Kafka en producción, considera usar [Confluent Cloud](https://confluent.cloud/) o [Upstash Kafka](https://upstash.com/)

### Opción 2: Variables de Entorno en Producción

```env
NODE_ENV=production
DB_HOST=tu-host-clever-cloud.services.clever-cloud.com
KAFKA_BROKERS=tu-kafka-prod:9092
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend en Vercel/Netlify

1. Deploy el directorio `frontend/` 
2. Configura `REACT_APP_API_URL` con la URL de tu backend
3. Build automático detecta React

---

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👨‍💻 Autores

- **Gabriel Niño** - [GabrielNinoA](https://github.com/GabrielNinoA)

---

## 📞 Soporte

¿Necesitas ayuda? 

- 📧 Abre un [Issue en GitHub](https://github.com/GabrielNinoA/Complaints_System_EPB/issues)
- 📖 Revisa la [documentación de Kafka](./KAFKA-AUDIT-SYSTEM.md)
- 🚀 Consulta la [guía de inicio rápido](./KAFKA-QUICKSTART.md)

---

**Sistema de Quejas Boyacá v2.2** - Powered by Apache Kafka 🚀
