// ============================================================
// TESTS UNITARIOS - DATABASE SERVICE (Entidades)
// ============================================================

const dbService = require('../src/services/database');

describe('DatabaseService - Entidades', () => {
    
    describe('getAllEntidades', () => {
        test('Debe retornar un array de entidades', async () => {
            const entidades = await dbService.getAllEntidades();

            expect(Array.isArray(entidades)).toBe(true);
            expect(entidades.length).toBeGreaterThan(0);
        });

        test('Debe retornar CORPOBOYACA como una de las entidades', async () => {
            const entidades = await dbService.getAllEntidades();

            const corpoboyaca = entidades.find(e => e.nombre === 'CORPOBOYACA');
            expect(corpoboyaca).toBeDefined();
            expect(corpoboyaca.id).toBe(1);
        });
    });

    describe('getEntidadById', () => {
        test('Debe retornar una entidad existente', async () => {
            const entidad = await dbService.getEntidadById(1);

            expect(entidad).toBeDefined();
            expect(entidad).toHaveProperty('id', 1);
            expect(entidad).toHaveProperty('nombre', 'CORPOBOYACA');
        });

        test('Debe retornar null para entidad inexistente', async () => {
            const entidad = await dbService.getEntidadById(999999);

            expect(entidad).toBeNull();
        });
    });
});
