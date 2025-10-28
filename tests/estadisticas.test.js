// ============================================================
// TESTS UNITARIOS - DATABASE SERVICE (Estadísticas)
// ============================================================

const dbService = require('../src/services/database');

describe('DatabaseService - Estadísticas y Reportes', () => {

    describe('Contadores específicos', () => {
        test('Debe contar total de quejas', async () => {
            const repository = require('../src/repository/Repository');
            const count = await repository.countAllQuejas();

            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('Debe contar total de entidades', async () => {
            const repository = require('../src/repository/Repository');
            const count = await repository.countAllEntidades();

            expect(typeof count).toBe('number');
            expect(count).toBe(3); // Tenemos 3 entidades en los mocks
        });
    });
});
