const request = require('supertest');
const app = require('../server');

describe('Test: Reporte de Quejas', () => {

    test('Debe devolver la cantidad total de quejas y entidades', async () => {
        const response = await request(app)
            .get('/api/estadisticas')
            .expect('Content-Type', /json/)
            .expect(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('total_quejas');
        expect(response.body.data).toHaveProperty('total_entidades');
    });
});
