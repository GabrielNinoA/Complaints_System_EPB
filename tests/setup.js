// ============================================================
// SETUP GLOBAL PARA TESTS UNITARIOS
// ============================================================
// Este archivo mockea el Repository para que los tests no necesiten
// conectarse a una base de datos real (MySQL).
// Funciona tanto en local como en GitHub Actions sin configuración.

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.DB_PORT = '3306';

// Datos de prueba simulados
const mockEntidades = [
    { id: 1, nombre: 'CORPOBOYACA', estado: true, created_at: new Date(), updated_at: new Date() },
    { id: 2, nombre: 'LOTERIA DE BOYACA', estado: true, created_at: new Date(), updated_at: new Date() },
    { id: 3, nombre: 'EBSA', estado: true, created_at: new Date(), updated_at: new Date() }
];

const mockQuejas = [
    {
        id: 1,
        entidad_id: 1,
        descripcion: 'Queja de prueba para CORPOBOYACA',
        state: 'open',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 2,
        entidad_id: 1,
        descripcion: 'Segunda queja para CORPOBOYACA',
        state: 'in process',
        created_at: new Date(),
        updated_at: new Date()
    }
];

const mockComentarios = [
    {
        id: 1,
        queja_id: 1,
        texto: 'Comentario de prueba',
        created_at: new Date(),
        updated_at: new Date()
    }
];

// Mock del Repository - simula todas las operaciones de base de datos
jest.mock('../src/repository/Repository', () => {
    let quejaIdCounter = 3;
    let comentarioIdCounter = 2;
    
    return {
        initialize: jest.fn().mockResolvedValue(undefined),
        ensureConnection: jest.fn().mockResolvedValue(undefined),
        healthCheck: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(undefined),
        isConnected: true,
        
        // ENTIDADES
        findAllEntidades: jest.fn().mockResolvedValue(mockEntidades),
        findEntidadById: jest.fn((id) => {
            const entidad = mockEntidades.find(e => e.id === parseInt(id));
            return Promise.resolve(entidad || null);
        }),
        findEntidadByNombre: jest.fn((nombre) => {
            const entidad = mockEntidades.find(e => e.nombre.toLowerCase() === nombre.toLowerCase());
            return Promise.resolve(entidad || null);
        }),
        countAllEntidades: jest.fn().mockResolvedValue(mockEntidades.length),
        
        // QUEJAS
        findAllQuejas: jest.fn((limit, offset) => {
            return Promise.resolve(mockQuejas.slice(offset, offset + limit));
        }),
        findQuejaById: jest.fn((id) => {
            const queja = mockQuejas.find(q => q.id === parseInt(id));
            return Promise.resolve(queja || null);
        }),
        findQuejasByEntidad: jest.fn((entidadId, limit, offset) => {
            const quejas = mockQuejas.filter(q => q.entidad_id === parseInt(entidadId));
            return Promise.resolve(quejas.slice(offset, offset + limit));
        }),
        insertQueja: jest.fn((entidad_id, descripcion) => {
            const newId = quejaIdCounter++;
            mockQuejas.push({
                id: newId,
                entidad_id,
                descripcion,
                state: 'open',
                created_at: new Date(),
                updated_at: new Date()
            });
            return Promise.resolve(newId);
        }),
        deleteQuejaById: jest.fn((id) => {
            const index = mockQuejas.findIndex(q => q.id === parseInt(id));
            if (index !== -1) mockQuejas.splice(index, 1);
            return Promise.resolve(true);
        }),
        updateQuejaState: jest.fn((id, state) => {
            const queja = mockQuejas.find(q => q.id === parseInt(id));
            if (queja) {
                queja.state = state;
                queja.updated_at = new Date();
            }
            return Promise.resolve(true);
        }),
        countAllQuejas: jest.fn().mockResolvedValue(mockQuejas.length),
        countQuejasByEntidad: jest.fn((entidadId) => {
            const count = mockQuejas.filter(q => q.entidad_id === parseInt(entidadId)).length;
            return Promise.resolve(count);
        }),
        countQuejasToday: jest.fn().mockResolvedValue(5),
        countQuejasThisMonth: jest.fn().mockResolvedValue(30),
        
        // COMENTARIOS
        findComentariosByQueja: jest.fn((quejaId) => {
            const comentarios = mockComentarios.filter(c => c.queja_id === parseInt(quejaId));
            return Promise.resolve(comentarios);
        }),
        findComentarioById: jest.fn((id) => {
            const comentario = mockComentarios.find(c => c.id === parseInt(id));
            return Promise.resolve(comentario || null);
        }),
        insertComentario: jest.fn((queja_id, texto) => {
            const newId = comentarioIdCounter++;
            mockComentarios.push({
                id: newId,
                queja_id,
                texto,
                created_at: new Date(),
                updated_at: new Date()
            });
            return Promise.resolve(newId);
        }),
        deleteComentarioById: jest.fn((id) => {
            const index = mockComentarios.findIndex(c => c.id === parseInt(id));
            if (index !== -1) mockComentarios.splice(index, 1);
            return Promise.resolve(true);
        }),
        countAllComentarios: jest.fn().mockResolvedValue(mockComentarios.length),
        countComentariosToday: jest.fn().mockResolvedValue(2),
        
        // Ejecutar consultas personalizadas
        execute: jest.fn().mockResolvedValue([])
    };
});

// Suprimir logs de consola durante tests para output más limpio
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Limpiar mocks después de cada test
afterEach(() => {
    jest.clearAllMocks();
});
