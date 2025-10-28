// ============================================================
// TESTS UNITARIOS - DATABASE SERVICE (Comentarios)
// ============================================================

const dbService = require('../src/services/database');

describe('DatabaseService - Comentarios', () => {
    
    describe('createComentario', () => {
        test('Debe crear un comentario válido', async () => {
            const comentarioData = {
                queja_id: 1,
                texto: 'Este es un comentario de prueba válido'
            };

            const result = await dbService.createComentario(comentarioData);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('insertId');
            expect(result).toHaveProperty('queja_id', 1);
            expect(result.texto).toContain('comentario');
        });

        test('Debe rechazar comentario sin queja_id', async () => {
            const comentarioData = {
                texto: 'Este es un comentario válido pero sin queja_id'
            };

            await expect(dbService.createComentario(comentarioData))
                .rejects
                .toThrow();
        });
    });

    describe('getComentariosByQueja', () => {
        test('Debe retornar comentarios de una queja existente', async () => {
            const comentarios = await dbService.getComentariosByQueja(1);

            expect(Array.isArray(comentarios)).toBe(true);
            expect(comentarios.length).toBeGreaterThan(0);
            expect(comentarios[0]).toHaveProperty('queja_id', 1);
        });

        test('Debe retornar array vacío para queja sin comentarios', async () => {
            const comentarios = await dbService.getComentariosByQueja(2);

            expect(Array.isArray(comentarios)).toBe(true);
        });
    });
});
