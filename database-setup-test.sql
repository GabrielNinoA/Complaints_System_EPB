-- Script para la creación de la base de datos de TESTS
-- Usa la base de datos ya creada por GitHub Actions

USE complaints_boyaca;

-- Crear tabla de entidades
CREATE TABLE IF NOT EXISTS entidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    
    FOREIGN KEY (entidad_id) REFERENCES entidades(id) ON DELETE CASCADE,
    
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
    
    FOREIGN KEY (queja_id) REFERENCES quejas(id) ON DELETE CASCADE,
    
    INDEX idx_queja (queja_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de prueba para las entidades
INSERT INTO entidades (nombre, estado) VALUES
    ('CORPOBOYACA', true),
    ('LOTERIA DE BOYACA', true),
    ('EBSA', true),
    ('ITBOY', true),
    ('INDEPORTES BOYACA', true),
    ('INDERBU', true),
    ('SECRETARIA DE SALUD', true)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Insertar algunas quejas de prueba
INSERT INTO quejas (entidad_id, descripcion, state) VALUES
    (1, 'Queja de prueba para CORPOBOYACA - Problema con servicios ambientales', 'open'),
    (1, 'Segunda queja para CORPOBOYACA - Reporte de contaminación', 'in process'),
    (2, 'Queja para Lotería de Boyacá - Problema con premios', 'open'),
    (3, 'Queja para EBSA - Corte de energía frecuente', 'open');

-- Insertar algunos comentarios de prueba
INSERT INTO comentarios (queja_id, texto) VALUES
    (1, 'Este es un comentario de prueba para la primera queja'),
    (1, 'Segundo comentario de seguimiento'),
    (2, 'Comentario para la segunda queja');
