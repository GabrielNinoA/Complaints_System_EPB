#!/usr/bin/env node

/**
 * Script para verificar el estado del sistema
 * Ejecuta: node scripts/health-check.js
 */

require('dotenv').config();
const dbService = require('../src/services/database');

async function healthCheck() {
    console.log('🏥 HEALTH CHECK - Sistema de Quejas Boyacá v2.0');
    console.log('================================================\n');

    const results = {
        database: false,
        environment: false,
        overall: false
    };

    // 1. Verificar variables de entorno
    console.log('🔧 Verificando configuración...');
    const requiredEnvVars = [
        'MYSQL_ADDON_HOST',
        'MYSQL_ADDON_PORT', 
        'MYSQL_ADDON_USER',
        'MYSQL_ADDON_PASSWORD',
        'MYSQL_ADDON_DB'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
        console.log('✅ Variables de entorno: OK');
        results.environment = true;
    } else {
        console.log('❌ Variables de entorno: FALTANTES');
        console.log(`   Variables faltantes: ${missingVars.join(', ')}`);
    }

    // 2. Verificar conexión a base de datos
    console.log('\n📡 Verificando conexión a base de datos...');
    try {
        await dbService.initialize();
        const isHealthy = await dbService.healthCheck();
        
        if (isHealthy) {
            console.log('✅ Base de datos: CONECTADA');
            
            // Información adicional
            const connectionInfo = await dbService.getConnectionInfo();
            console.log(`   📊 DB: ${connectionInfo.current_database}`);
            console.log(`   🔢 MySQL: ${connectionInfo.mysql_version}`);
            
            results.database = true;
        } else {
            console.log('❌ Base de datos: NO RESPONDE');
        }
    } catch (error) {
        console.log('❌ Base de datos: ERROR DE CONEXIÓN');
        console.log(`   Error: ${error.message}`);
    }

    // 3. Verificar datos básicos
    if (results.database) {
        console.log('\n📋 Verificando datos...');
        try {
            const [entidades, totalQuejas] = await Promise.all([
                dbService.getAllEntidades(),
                dbService.getQuejasCount()
            ]);
            
            console.log(`✅ Entidades: ${entidades.length} disponibles`);
            console.log(`✅ Quejas: ${totalQuejas} registradas`);
            
            if (entidades.length === 0) {
                console.log('⚠️  Advertencia: No hay entidades cargadas');
            }
        } catch (error) {
            console.log('❌ Error verificando datos');
        }
    }

    // 4. Verificar servidor
    console.log('\n🖥️  Información del servidor...');
    console.log(`✅ Node.js: ${process.version}`);
    console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Puerto: ${process.env.PORT || 3000}`);
    console.log(`✅ Uptime: ${Math.floor(process.uptime())}s`);

    // 5. Resultado general
    results.overall = results.database && results.environment;
    
    console.log('\n' + '='.repeat(50));
    if (results.overall) {
        console.log('🎉 ESTADO GENERAL: ✅ SALUDABLE');
        console.log('   El sistema está listo para operar');
    } else {
        console.log('⚠️  ESTADO GENERAL: ❌ PROBLEMAS DETECTADOS');
        console.log('   Revisa los errores anteriores');
    }
    console.log('='.repeat(50) + '\n');

    // Cerrar conexión
    if (results.database) {
        await dbService.close();
    }

    // Exit code
    process.exit(results.overall ? 0 : 1);
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
    healthCheck().catch(error => {
        console.error('❌ Error crítico en health check:', error.message);
        process.exit(1);
    });
}

module.exports = { healthCheck };
