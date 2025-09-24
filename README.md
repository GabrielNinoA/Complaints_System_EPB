src/
├── config/          # Configuraciones (DB, etc.)
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware customizado
├── routes/          # Definición de rutas
├── services/        # Servicios (DB, etc.)
└── validators/      # Validaciones de datos
# Sistema de Quejas Boyacá

Sistema web para la gestión de quejas y reclamos de entidades públicas de Boyacá.

---

## Tecnologías usadas y requeridas

- [Node.js v18+](https://nodejs.org/) (backend)
- [npm v9+](https://www.npmjs.com/get-npm) (gestor de paquetes)
- [Express v4.18+](https://expressjs.com/)
- [MySQL2 v3.6+](https://www.npmjs.com/package/mysql2) (cliente MySQL para Node)
- [Clever Cloud](https://www.clever-cloud.com/) (hosting base de datos MySQL)
- [Render](https://render.com/) (hosting backend)
- [React v18+](https://react.dev/) (frontend)
- [React Router v6+](https://reactrouter.com/)
- [Axios](https://axios-http.com/) (peticiones HTTP)

---

## ¿Cómo correr el programa?

### 1. Configuración y ejecución de la base de datos en Clever Cloud

1. Crea una base de datos MySQL en Clever Cloud.
2. Obtén los datos de conexión (host, usuario, contraseña, puerto, nombre de la base de datos).
3. Ejecuta el script `database-setup.sql` para crear las tablas y datos iniciales:

	**En PowerShell:**
	```bash
	Get-Content database-setup.sql | mysql -h <host> -P <puerto> -u <usuario> -p<contraseña> <nombre_db>
	```
	**En Linux/Mac:**
	```bash
	mysql -h <host> -P <puerto> -u <usuario> -p<contraseña> <nombre_db> < database-setup.sql
	```

4. Verifica que las tablas y entidades se hayan creado correctamente.

### 2. Configuración del entorno local

1. Copia el archivo `.env.example` a `.env` y completa los valores según tu configuración (ver sección siguiente).
2. Instala las dependencias del backend:
	```bash
	npm install
	```
3. Instala las dependencias del frontend:
	```bash
	cd frontend
	npm install
	cd ..
	```

### 3. Ejecución en local

1. Inicia el backend:
	```bash
	npm start
	```
2. Inicia el frontend (en otra terminal):
	```bash
	cd frontend
	npm start
	```
3. Accede a la app en [http://localhost:3000](http://localhost:3000) (backend) y [http://localhost:3001](http://localhost:3001) (frontend, el puerto puede variar).

---

## .env de ejemplo (explicación de variables)

Revisa el archivo `.env.example` para ver todas las variables necesarias. Cada variable tiene una breve descripción de lo que debe ir en ese campo.

---

## ¿Cómo montarlo en Render?

1. Sube el proyecto a un repositorio en GitHub.
2. Crea un nuevo servicio web en [Render](https://render.com/):
	- Elige el repositorio.
	- Selecciona el build command: `npm install && npm run build`
	- Selecciona el start command: `npm start`
3. Configura las variables de entorno en el dashboard de Render (usa los mismos valores que en tu `.env`).
4. Asegúrate de que la base de datos de Clever Cloud esté accesible desde Render (IP pública permitida).
5. Render detectará automáticamente los cambios y hará deploy continuo.