// ============================================================
// TESTS UNITARIOS - DATABASE SERVICE (Quejas)
// ============================================================
// Estos tests prueban la lógica de negocio del servicio sin
// conectarse a una base de datos real

const dbService = require('../src/services/database');

describe('DatabaseService - Quejas', () => {
    
    describe('createQueja', () => {
        test('Debe crear una queja válida', async () => {
            const quejaData = {
                entidad_id: 1,
                descripcion: 'Esta es una queja de prueba con descripción válida'
            };

            const result = await dbService.createQueja(quejaData);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('insertId');
            expect(result).toHaveProperty('entidad_id', 1);
            expect(result.descripcion).toContain('queja de prueba');
        });

        test('Debe rechazar queja con descripción muy corta', async () => {
            const quejaData = {
                entidad_id: 1,
                descripcion: 'Corta'
            };

            await expect(dbService.createQueja(quejaData))
                .rejects
                .toThrow('La descripción debe tener al menos 10 caracteres');
        });
    });

    describe('getQuejasByEntidad', () => {
        test('Debe retornar quejas de una entidad existente', async () => {
            const quejas = await dbService.getQuejasByEntidad(1);

            expect(Array.isArray(quejas)).toBe(true);
            expect(quejas.length).toBeGreaterThan(0);
            expect(quejas[0]).toHaveProperty('entidad_id', 1);
        });

        test('Debe retornar array vacío para entidad sin quejas', async () => {
            const quejas = await dbService.getQuejasByEntidad(3); // EBSA sin quejas

            expect(Array.isArray(quejas)).toBe(true);
            expect(quejas.length).toBe(0);
        });
    });
});
