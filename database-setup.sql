
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

-- Insertar las entidades base del sistema (sin caracteres especiales inicialmente)
INSERT INTO entidades (nombre, estado) VALUES
('CORPOBOYACA', true),
('LOTERIA DE BOYACA', true),
('EBSA', true),
('ITBOY', true),
('INDEPORTES', true),
('ALCALDIA MUNICIPAL', true),
('SECRETARIA DE SALUD', true);

-- Actualizar con caracteres especiales correctos usando UPDATE
UPDATE entidades SET nombre = 'LOTERÍA DE BOYACÁ' WHERE nombre = 'LOTERIA DE BOYACA';
UPDATE entidades SET nombre = 'ALCALDÍA MUNICIPAL' WHERE nombre = 'ALCALDIA MUNICIPAL';
UPDATE entidades SET nombre = 'SECRETARÍA DE SALUD' WHERE nombre = 'SECRETARIA DE SALUD';

-- Verificar que se insertaron correctamente
SELECT 'Entidades creadas correctamente:' as mensaje;
SELECT id, nombre, estado FROM entidades ORDER BY id;

-- Mostrar estructura de las tablas
SELECT 'Estructura de la tabla entidades:' as mensaje;
DESCRIBE entidades;

SELECT 'Estructura de la tabla quejas:' as mensaje;
DESCRIBE quejas;
