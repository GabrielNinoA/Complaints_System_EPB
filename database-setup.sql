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
    state ENUM('open', 'in process', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relación con entidades
    FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE,
    
    -- Índices para optimización
    INDEX idx_entidad (entidad_id),
    INDEX idx_created_at (created_at),
    INDEX idx_state (state)
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

-- PASO 1: Identificar y corregir los nombres duplicados
-- Actualizar los nombres con caracteres especiales para que sean consistentes

UPDATE entidades SET nombre = 'CORPOBOYACÁ' WHERE nombre = 'CORPOBOYACA' OR nombre = 'CORPOBOYAC??';
UPDATE entidades SET nombre = 'LOTERÍA DE BOYACÁ' WHERE nombre = 'LOTERIA DE BOYACA' OR nombre LIKE 'LOTER%';
UPDATE entidades SET nombre = 'ALCALDÍA MUNICIPAL' WHERE nombre = 'ALCALDIA MUNICIPAL' OR nombre = 'ALCALD??A MUNICIPAL';
UPDATE entidades SET nombre = 'SECRETARÍA DE SALUD' WHERE nombre = 'SECRETARIA DE SALUD';

-- PASO 2: Eliminar duplicados manteniendo el registro más reciente
DELETE e1 FROM entidades e1
INNER JOIN entidades e2 
WHERE 
    e1.id > e2.id 
    AND e1.nombre = e2.nombre;

-- PASO 3: Insertar solo las entidades que no existen
INSERT IGNORE INTO entidades (nombre, estado) VALUES
('CORPOBOYACÁ', true),
('LOTERÍA DE BOYACÁ', true),
('EBSA', true),
('ITBOY', true),
('INDEPORTES', true),
('ALCALDÍA MUNICIPAL', true),
('SECRETARÍA DE SALUD', true);

-- PASO 4: Agregar columna state a la tabla quejas si no existe
-- Esto es para bases de datos existentes que no tienen la columna
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'quejas' 
AND column_name = 'state';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE quejas ADD COLUMN state ENUM(\'open\', \'in process\', \'closed\') NOT NULL DEFAULT \'open\'', 
    'SELECT "Columna state ya existe" as mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que se insertaron correctamente
SELECT 'Entidades después de la corrección:' as mensaje;
SELECT id, nombre, estado FROM entidades ORDER BY id;

-- Mostrar estructura de las tablas
SELECT 'Estructura de la tabla entidades:' as mensaje;
DESCRIBE entidades;

SELECT 'Estructura de la tabla quejas:' as mensaje;
DESCRIBE quejas;

SELECT 'Estructura de la tabla comentarios:' as mensaje;
DESCRIBE comentarios;