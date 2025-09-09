// Setup para Jest tests

// Configurar variables de entorno para testing
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

// Configurar timeout para operaciones de base de datos
jest.setTimeout(30000);

// Mock console en testing si es necesario
if (process.env.JEST_SILENT) {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

// Setup global para tests
beforeAll(() => {
    console.log('🧪 Iniciando suite de tests...');
});

afterAll(() => {
    console.log('✅ Tests completados');
});
