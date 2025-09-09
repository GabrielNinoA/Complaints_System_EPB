const request = require('supertest');
const app = require('../server');

describe('Sistema de Quejas Boyacá v2.0 - API Tests', () => {
    let server;

    beforeAll(() => {
        // Configurar entorno de testing
        process.env.NODE_ENV = 'test';
    });

    afterAll(async () => {
        // Cerrar servidor si existe
        if (server) {
            server.close();
        }
    });

    describe('Health Checks', () => {
        test('GET /health - should return server status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
        });

        test('GET /api/health - should return detailed health check', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('status');
        });
    });

    describe('API Info', () => {
        test('GET / - should return API info', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
        });

        test('GET /api - should return API documentation', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('endpoints');
        });

        test('GET /api/docs - should return API documentation', async () => {
            const response = await request(app)
                .get('/api/docs')
                .expect(200);

            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('endpoints');
            expect(Array.isArray(response.body.endpoints)).toBe(true);
        });
    });

    describe('Entidades Endpoints', () => {
        test('GET /api/entidades - should return list of entities', async () => {
            const response = await request(app)
                .get('/api/entidades')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('count');
            
            if (response.body.success) {
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(typeof response.body.count).toBe('number');
            }
        });

        test('GET /api/entidades/1 - should return specific entity if exists', async () => {
            const response = await request(app)
                .get('/api/entidades/1');

            expect(response.body).toHaveProperty('success');
            
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data).toHaveProperty('nombre');
            }
        });

        test('GET /api/entidades/search - should validate search parameter', async () => {
            const response = await request(app)
                .get('/api/entidades/search?nombre=CO')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
        });
    });

    describe('Quejas Endpoints', () => {
        test('GET /api/quejas - should return list of complaints', async () => {
            const response = await request(app)
                .get('/api/quejas')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            
            if (response.body.success) {
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.pagination).toHaveProperty('total');
                expect(response.body.pagination).toHaveProperty('limit');
            }
        });

        test('POST /api/quejas - should validate request body', async () => {
            const invalidComplaint = {
                descripcion: 'Too short'
            };

            const response = await request(app)
                .post('/api/quejas')
                .send(invalidComplaint)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });

        test('GET /api/quejas/entidad/1 - should return complaints by entity', async () => {
            const response = await request(app)
                .get('/api/quejas/entidad/1')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
        });
    });

    describe('Estadísticas Endpoints', () => {
        test('GET /api/estadisticas - should return general statistics', async () => {
            const response = await request(app)
                .get('/api/estadisticas')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            
            if (response.body.success) {
                expect(response.body.data).toHaveProperty('total_quejas');
                expect(response.body.data).toHaveProperty('total_entidades');
            }
        });

        test('GET /api/estadisticas/entidades - should return distribution by entity', async () => {
            const response = await request(app)
                .get('/api/estadisticas/entidades')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
        });

        test('GET /api/estadisticas/tendencia - should return monthly trend', async () => {
            const response = await request(app)
                .get('/api/estadisticas/tendencia')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('Error Handling', () => {
        test('GET /api/nonexistent - should return 404', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        test('GET /api/entidades/invalid - should return validation error', async () => {
            const response = await request(app)
                .get('/api/entidades/invalid')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('Rate Limiting', () => {
        test('Should handle multiple requests without immediate blocking', async () => {
            const promises = Array(5).fill(null).map(() => 
                request(app).get('/api/entidades')
            );

            const responses = await Promise.all(promises);
            
            // Al menos las primeras requests deberían pasar
            expect(responses[0].status).toBeLessThan(500);
        });
    });
});
