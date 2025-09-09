# Variables de Entorno para Render

Estas son las variables de entorno que necesitas configurar en el dashboard de Render para que la aplicación funcione correctamente.

## 🔧 Variables Requeridas

### Base de Datos (Clever Cloud MySQL)
```
MYSQL_ADDON_DB=bn1wjilwxf7lfij13vn4
MYSQL_ADDON_HOST=bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com
MYSQL_ADDON_PASSWORD=eglJqdgxMGyBuPuw1Ai
MYSQL_ADDON_PORT=21198
MYSQL_ADDON_URI=mysql://uykjziuuy3bzkvf8:eglJqdgxMGyBuPuw1Ai@bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com:21198/bn1wjilwxf7lfij13vn4
MYSQL_ADDON_USER=uykjziuuy3bzkvf8
MYSQL_ADDON_VERSION=8.4
```

### Variables Alternativas (Compatibilidad)
```
DB_HOST=bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com
DB_PORT=21198
DB_USER=uykjziuuy3bzkvf8
DB_PASSWORD=eglJqdgxMGyBuPuw1Ai
DB_NAME=bn1wjilwxf7lfij13vn4
DATABASE_URL=mysql://uykjziuuy3bzkvf8:eglJqdgxMGyBuPuw1Ai@bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com:21198/bn1wjilwxf7lfij13vn4
```

### Configuración del Servidor
```
NODE_ENV=production
PORT=3000
```

### Seguridad (¡CAMBIAR EN PRODUCCIÓN!)
```
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura_para_produccion_2024
SESSION_SECRET=tu_clave_secreta_session_muy_larga_y_segura_para_produccion_2024
```

## 📧 Variables de Email (Opcional)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=quejasboyaca746@gmail.com
EMAIL_PASSWORD=tfcwzsyhtfilezrl
EMAIL_FROM=Sistema Quejas Boyacá <quejasboyaca746@gmail.com>
EMAIL_TO=quejasboyaca746@gmail.com
EMAIL_SECURE=false
ENABLE_EMAIL_NOTIFICATIONS=true
```

## 📋 Instrucciones para configurar en Render

1. **Ve a tu dashboard de Render**
2. **Selecciona tu servicio web**
3. **Ve a la pestaña "Environment"**
4. **Agrega cada variable una por una:**
   - **Key**: Nombre de la variable (ej: `NODE_ENV`)
   - **Value**: Valor de la variable (ej: `production`)

## ⚠️ Importante

- **Las claves JWT y SESSION deben ser diferentes y muy seguras en producción**
- **Puedes generar claves seguras usando:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **No incluyas comillas en los valores en Render**
- **Asegúrate de que `NODE_ENV=production` para que funcione correctamente**

## ✅ Variables Mínimas para Funcionar

Si quieres probar rápidamente, estas son las variables **mínimas** necesarias:

```
NODE_ENV=production
PORT=3000
MYSQL_ADDON_HOST=bn1wjilwxf7lfij13vn4-mysql.services.clever-cloud.com
MYSQL_ADDON_PORT=21198
MYSQL_ADDON_USER=uykjziuuy3bzkvf8
MYSQL_ADDON_PASSWORD=eglJqdgxMGyBuPuw1Ai
MYSQL_ADDON_DB=bn1wjilwxf7lfij13vn4
JWT_SECRET=clave_secreta_jwt_temporal_cambiar_en_produccion
SESSION_SECRET=clave_secreta_session_temporal_cambiar_en_produccion
```
