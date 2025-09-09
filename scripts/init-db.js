#!/usr/bin/env node

/**
 * Script para inicializar la base de datos
 * Ejecuta: node scripts/init-db.js
 */

require('dotenv').config();
const dbService = require('../src/services/database');

async function initializeDatabase() {
    console.log('🚀 Iniciando configuración de base de datos...\n');

    try {
        // Inicializar conexión
        console.log('📡 Conectando a la base de datos...');
        await dbService.initialize();

        // Verificar health
        console.log('🔍 Verificando estado de la base de datos...');
        const isHealthy = await dbService.healthCheck();
        
        if (!isHealthy) {
            throw new Error('La base de datos no está respondiendo correctamente');
        }

        // Obtener información de conexión
        const connectionInfo = await dbService.getConnectionInfo();
        console.log('✅ Conexión establecida exitosamente:');
        console.log(`   📊 Base de datos: ${connectionInfo.current_database}`);
        console.log(`   👤 Usuario: ${connectionInfo.db_user}`);
        console.log(`   🔢 Versión MySQL: ${connectionInfo.mysql_version}`);
        console.log(`   ⏰ Hora del servidor: ${connectionInfo.server_time}\n`);

        // Verificar tablas existentes
        console.log('🔍 Verificando estructura de tablas...');
        
        const entidades = await dbService.getAllEntidades();
        const totalQuejas = await dbService.getQuejasCount();
        
        console.log(`✅ Tabla 'entidades': ${entidades.length} registros`);
        console.log(`✅ Tabla 'quejas': ${totalQuejas} registros\n`);

        // Mostrar entidades disponibles
        if (entidades.length > 0) {
            console.log('📋 Entidades disponibles:');
            entidades.forEach((entidad, index) => {
                console.log(`   ${index + 1}. ${entidad.nombre} (ID: ${entidad.id})`);
            });
        } else {
            console.log('⚠️  No hay entidades cargadas. Ejecuta el script database-setup.sql');
        }

        console.log('\n🎉 Inicialización completada exitosamente!');
        console.log('🌐 El servidor está listo para recibir requests\n');

    } catch (error) {
        console.error('❌ Error durante la inicialización:');
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Código: ${error.code || 'N/A'}\n`);

        // Sugerencias según el tipo de error
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Sugerencias:');
            console.log('   - Verifica que las credenciales en .env sean correctas');
            console.log('   - Asegúrate de tener conexión a internet');
            console.log('   - Verifica que Clever Cloud esté disponible');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Sugerencias:');
            console.log('   - Verifica el usuario y contraseña en .env');
            console.log('   - Asegúrate de tener permisos en la base de datos');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 Sugerencias:');
            console.log('   - Verifica que el nombre de la base de datos sea correcto');
            console.log('   - Ejecuta el script database-setup.sql primero');
        }

        process.exit(1);
    } finally {
        // Cerrar conexión
        await dbService.close();
    }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
