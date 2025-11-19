# Guía Paso a Paso - Arquitectura de Eventos con Kafka

Esta guía te llevará a través de la implementación completa del sistema de eventos con Kafka para el Sistema de Quejas Boyacá.

## 📋 Estado Actual

✅ **Completado:**
- Kafka broker configurado (docker-compose.yml)
- Email Consumer Service creado
- Event Producer integrado en backend
- estadisticasController modificado para usar eventos
- Endpoint testEmail eliminado

⏳ **Pendiente:**
- Iniciar Docker Desktop
- Instalar dependencias
- Levantar servicios
- Probar el flujo completo

---

## 🚀 Paso 1: Iniciar Docker Desktop

### Windows
1. Abre Docker Desktop desde el menú de inicio
2. Espera a que el motor de Docker esté completamente iniciado
3. Verifica que aparezca el ícono de Docker en la bandeja del sistema
4. Confirma que dice "Docker Desktop is running"

### Verificar Docker
```powershell
docker --version
docker-compose --version
```

**Resultado esperado:**
```
Docker version 24.x.x
docker-compose version 1.29.x
```

---

## 🐘 Paso 2: Levantar Kafka y Zookeeper

### Navegar a la carpeta del broker
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB\kafka-broker"
```

### Iniciar los contenedores
```powershell
docker-compose up -d
```

**Resultado esperado:**
```
Creating network "kafka-broker_default" with the default driver
Creating kafka-broker_zookeeper_1 ... done
Creating kafka-broker_kafka_1     ... done
```

### Verificar que están corriendo
```powershell
docker ps
```

**Deberías ver:**
- `confluentinc/cp-zookeeper:7.5.0` en puerto 2181
- `confluentinc/cp-kafka:7.5.0` en puerto 9092

### Ver logs (opcional)
```powershell
# Ver logs de Kafka
docker-compose logs -f kafka

# Ver logs de Zookeeper
docker-compose logs -f zookeeper

# Salir con Ctrl+C
```

---

## 📦 Paso 3: Instalar Dependencias

### Backend Principal (kafkajs + uuid)
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB"

npm install kafkajs uuid
```

**Resultado esperado:**
```
+ kafkajs@2.2.4
+ uuid@9.x.x
added X packages
```

### Email Consumer Service
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB\Email_Consumer_Service"

npm install
```

**Resultado esperado:**
```
+ kafkajs@2.2.4
+ nodemailer@6.9.0
+ dotenv@16.3.1
added X packages
```

---

## 🔐 Paso 4: Configurar Variables de Entorno

### Verificar .env del Email Consumer Service

Abre: `Email_Consumer_Service\.env`

Asegúrate de que tiene:
```env
# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=email-consumer-service
KAFKA_GROUP_ID=email-consumer-group

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=quejasboyaca746@gmail.com
EMAIL_PASS=tu_password_aqui
EMAIL_FROM=Sistema de Quejas Boyacá <quejasboyaca746@gmail.com>
EMAIL_NOTIFICATION_TO=quejasboyaca746@gmail.com

# Service Configuration
NODE_ENV=development
SERVICE_PORT=3003
```

⚠️ **IMPORTANTE:** Reemplaza `tu_password_aqui` con la contraseña de aplicación de Gmail.

### Verificar .env del Backend Principal

El archivo `.env` principal ya debería tener las credenciales de email correctas.

---

## 🎯 Paso 5: Iniciar Servicios en Orden

### Terminal 1 - Kafka (ya debería estar corriendo)
```powershell
cd kafka-broker
docker-compose ps
```

### Terminal 2 - Email Consumer Service
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB\Email_Consumer_Service"

npm start
```

**Logs esperados:**
```
📧 Email Consumer Service iniciado
📩 Conectado a Kafka broker: localhost:9092
📬 Consumiendo del tópico: email.notifications
⏳ Esperando mensajes...
```

### Terminal 3 - Backend Principal
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB"

npm start
```

**Logs esperados:**
```
🚀 Servidor escuchando en puerto 3000
✅ Base de datos conectada
📊 Event Producer inicializado
```

### Terminal 4 - Frontend
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB\frontend"

npm start
```

**Se abrirá el navegador en:** `http://localhost:3001`

### Terminal 5 - Auth Microservice
```powershell
cd "c:\Users\newte\OneDrive\Documentos\DAVID\Universidad Santiago\Septimo semestre\Software II\Complaints_Boyaca\Complaints_System_EPB\Autenticator_Complaint_System_EPB"

npm start
```

**Puerto esperado:** `3002`

---

## ✅ Paso 6: Probar el Flujo Completo

### 1. Acceder al Frontend
Abre el navegador: `http://localhost:3001`

### 2. Generar un Reporte
1. Ve a la sección de **"Reportes"**
2. Haz clic en **"Ver Reportes"**
3. Observa los logs en las terminales

### 3. Verificar Logs

**Terminal del Backend (Terminal 3):**
```
📧 Evento publicado exitosamente a Kafka: uuid-trace-id-aqui
```

**Terminal del Email Consumer (Terminal 2):**
```
✅ Procesando lote de 1 mensajes
📧 Enviando email para evento: uuid-trace-id-aqui
✅ Email enviado exitosamente: <message-id@smtp.gmail.com>
✅ Lote de 1 mensajes procesado y confirmado
```

### 4. Verificar Email Recibido
Revisa la bandeja de entrada de `quejasboyaca746@gmail.com`

**Asunto esperado:**
```
📊 Nuevo Reporte Generado - Sistema de Quejas Boyacá
```

**Contenido esperado:**
- Usuario: `[IP del cliente]`
- Fecha y Hora: `2024-01-15T10:30:00.000Z`
- Acción: `REPORT_GENERATED`
- Estadísticas del reporte
- Trace ID: `uuid-trace-id-aqui`

---

## 🔍 Paso 7: Verificar Persistencia de Cola

Este paso prueba que los mensajes se mantienen en Kafka cuando el consumidor está offline.

### 1. Detener Email Consumer
En la **Terminal 2**, presiona `Ctrl+C`

### 2. Generar Varios Reportes
- Ve al frontend
- Genera 3-5 reportes haciendo clic en "Ver Reportes" varias veces
- Observa en el backend que los eventos se publican:
```
📧 Evento publicado exitosamente a Kafka: trace-id-1
📧 Evento publicado exitosamente a Kafka: trace-id-2
📧 Evento publicado exitosamente a Kafka: trace-id-3
```

### 3. Reiniciar Email Consumer
```powershell
npm start
```

**Deberías ver:**
```
✅ Procesando lote de 3 mensajes
📧 Enviando email para evento: trace-id-1
✅ Email enviado exitosamente
📧 Enviando email para evento: trace-id-2
✅ Email enviado exitosamente
📧 Enviando email para evento: trace-id-3
✅ Email enviado exitosamente
✅ Lote de 3 mensajes procesado y confirmado
```

✅ **¡Los mensajes se mantuvieron en Kafka y se procesaron cuando el consumidor volvió!**

---

## 🐛 Solución de Problemas

### Kafka no inicia
```powershell
# Limpiar contenedores anteriores
docker-compose down -v

# Reiniciar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Backend no se conecta a Kafka
```powershell
# Verificar que Kafka está en puerto 9092
docker ps | grep kafka

# Si Kafka está en otro puerto, actualiza .env:
# KAFKA_BROKER=localhost:PUERTO_CORRECTO
```

### Email Consumer no recibe mensajes
```powershell
# Verificar el tópico existe (dentro del contenedor de Kafka)
docker exec -it kafka-broker_kafka_1 kafka-topics --list --bootstrap-server localhost:9092

# Debería aparecer: email.notifications
```

### Emails no se envían
1. Verifica la contraseña de aplicación de Gmail
2. Asegúrate de que EMAIL_NOTIFICATION_TO tiene un email válido
3. Revisa los logs del consumidor para ver errores específicos

### Puertos en uso
```powershell
# Verificar qué está usando cada puerto
netstat -ano | findstr "3000"
netstat -ano | findstr "3001"
netstat -ano | findstr "3002"
netstat -ano | findstr "3003"
netstat -ano | findstr "9092"
```

---

## 📊 Resumen de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend Principal | 3000 | http://localhost:3000 |
| Frontend React | 3001 | http://localhost:3001 |
| Auth Microservice | 3002 | http://localhost:3002 |
| Email Consumer | 3003 | (interno) |
| Kafka Broker | 9092 | localhost:9092 |
| Zookeeper | 2181 | localhost:2181 |

---

## 📝 Próximos Pasos (Opcional)

### Historia Consumer Service
Después de que el email funcione correctamente, puedes implementar el servicio de historia:

1. Crear `History_Consumer_Service/` siguiendo la misma estructura
2. Consumir del tópico `history.events`
3. Guardar en la base de datos tabla `historia.cambios_estado`
4. Modificar eventProducer para publicar también al tópico de historia

### Tests Automatizados
```powershell
# Backend
npm test

# Frontend
cd frontend
npm test
```

---

## 🎉 ¡Listo!

Si todo funciona correctamente, tienes una arquitectura de eventos completa con:
- ✅ Kafka como broker de mensajes
- ✅ Persistencia de mensajes
- ✅ Procesamiento por lotes
- ✅ Trazabilidad con trace IDs
- ✅ Desacoplamiento de servicios
- ✅ Emails asíncronos

**¡Felicitaciones! Tu sistema está usando arquitectura de eventos.**
