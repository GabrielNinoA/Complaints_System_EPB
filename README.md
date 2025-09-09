# Sistema de Quejas - Reestructuración

Este directorio contiene la versión reestructurada del Sistema de Gestión de Quejas para entidades públicas de Boyacá.

## 🗄️ Configuración de Base de Datos

### Prerrequisitos
- MySQL Client instalado en tu sistema
- Acceso a internet para conectar con Clever Cloud
- Variables de entorno configuradas en el archivo `.env`

### 🚀 Instalación Automática de Base de Datos

Para crear automáticamente las tablas y cargar las entidades iniciales en la base de datos de Clever Cloud, ejecuta el siguiente comando:

```bash
Get-Content creation_DB.sql | mysql -h Host_DB -P port -u user_DB -ppassword_DB
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
