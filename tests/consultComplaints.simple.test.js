const request = require('supertest');
const app = require('../server');

describe('Test: Consultar Quejas por Entidad', () => {
    let entidadId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        try {
            const response = await request(app).get('/api/entidades');
            if (response.body.success && response.body.data && response.body.data.length > 0) {
                entidadId = response.body.data[0].id;
            } else {
                entidadId = 1;
            }
        } catch {
            entidadId = 1;
        }
    });

    test('Debe devolver un array de quejas para una entidad existente', async () => {
        const response = await request(app)
            .get(`/api/quejas/entidad/${entidadId}`)
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response.body).toHaveProperty('success', true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Debe devolver error para entidad inexistente', async () => {
        const response = await request(app)
            .get('/api/quejas/entidad/999999')
            .expect('Content-Type', /json/);
        expect(response.body).toHaveProperty('success', false);
    });

    test('Debe devolver paginación en la respuesta', async () => {
        const response = await request(app)
            .get(`/api/quejas/entidad/${entidadId}`)
            .expect('Content-Type', /json/);
        expect(response.body).toHaveProperty('pagination');
    });
});