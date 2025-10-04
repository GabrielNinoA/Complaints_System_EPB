-- Script para la creación de la base de datos del Sistema de Quejas
-- Versión actualizada con soporte para comentarios

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS bn1wjilwxf7lfij13vn4 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE bn1wjilwxf7lfij13vn4;

-- Crear tabla de entidades
CREATE TABLE IF NOT EXISTS entidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimización
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de quejas
CREATE TABLE IF NOT EXISTS quejas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relación con entidades
    FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Índices para optimización
    INDEX idx_entidad (entidad_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    queja_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relación con quejas
    FOREIGN KEY (queja_id) REFERENCES quejas(id) ON DELETE CASCADE,
    
    -- Índices para optimización
    INDEX idx_queja (queja_id),
    INDEX idx_fecha (fecha),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LIMPIAR DATOS EXISTENTES PARA EVITAR DUPLICADOS
DELETE FROM comentarios;
DELETE FROM quejas;
DELETE FROM entidades;

-- Insertar las entidades base del sistema con nombres correctos
INSERT INTO entidades (nombre, estado) VALUES
('CORPOBOYACÁ', true),
('LOTERÍA DE BOYACÁ', true),
('EBSA', true),
('ITBOY', true),
('INDEPORTES', true),
('ALCALDÍA MUNICIPAL', true),
('SECRETARÍA DE SALUD', true);

-- Verificar que se insertaron correctamente
SELECT 'Entidades creadas correctamente:' as mensaje;
SELECT id, nombre, estado FROM entidades ORDER BY id;

-- Mostrar estructura de las tablas
SELECT 'Estructura de la tabla entidades:' as mensaje;
DESCRIBE entidades;

SELECT 'Estructura de la tabla quejas:' as mensaje;
DESCRIBE quejas;

SELECT 'Estructura de la tabla comentarios:' as mensaje;
DESCRIBE comentarios;