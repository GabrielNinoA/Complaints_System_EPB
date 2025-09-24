-- Script para la creación de la base de datos del Sistema de Quejas v2.1
-- Incluye tabla de comentarios para quejas
-- Basado en el modelado de datos proporcionado

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

-- Crear tabla de comentarios para quejas
CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    queja_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relación con quejas
    FOREIGN KEY (queja_id) REFERENCES quejas(id) ON DELETE CASCADE,
    
    -- Índices para optimización
    INDEX idx_queja (queja_id),
    INDEX idx_fecha (fecha_comentario),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar las entidades base del sistema (sin caracteres especiales inicialmente)
INSERT INTO entidades (nombre, estado) VALUES
('CORPOBOYACA', true),
('LOTERIA DE BOYACA', true),
('EBSA', true),
('ITBOY', true),
('INDEPORTES', true),
('ALCALDIA MUNICIPAL', true),
('SECRETARIA DE SALUD', true)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Actualizar con caracteres especiales correctos usando UPDATE
UPDATE entidades SET nombre = 'LOTERÍA DE BOYACÁ' WHERE nombre = 'LOTERIA DE BOYACA';
UPDATE entidades SET nombre = 'ALCALDÍA MUNICIPAL' WHERE nombre = 'ALCALDIA MUNICIPAL';
UPDATE entidades SET nombre = 'SECRETARÍA DE SALUD' WHERE nombre = 'SECRETARIA DE SALUD';

-- Script para actualizar tabla existente (si ya tienes datos)
-- Solo ejecutar si la tabla comentarios no existe
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comentarios'
);

-- Crear tabla comentarios si no existe
SET @sql = IF(
    @table_exists = 0,
    'CREATE TABLE comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        queja_id INT NOT NULL,
        texto TEXT NOT NULL,
        fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (queja_id) REFERENCES quejas(id) ON DELETE CASCADE,
        INDEX idx_queja (queja_id),
        INDEX idx_fecha (fecha_comentario),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT "Tabla comentarios ya existe" as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Verificar relaciones de llaves foráneas
SELECT 
    'Relaciones de llaves foráneas:' as mensaje;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;