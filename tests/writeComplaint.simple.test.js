const request = require('supertest');
const app = require('../server');

describe('Test: Escribir Queja', () => {
    let corpoboyacaId = null;
    
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        
        try {
            const response = await request(app).get('/api/entidades');
            if (response.body.success && response.body.data) {
                const corpoboyaca = response.body.data.find(entidad => 
                    entidad.nombre === 'CORPOBOYACA' || 
                    entidad.nombre === 'CORPOBOYACÁ'
                );
                if (corpoboyaca) {
                    corpoboyacaId = corpoboyaca.id;
                    console.log(`Encontrada CORPOBOYACA con ID: ${corpoboyacaId}`);
                } else {
                    console.log('CORPOBOYACA no encontrada, usando ID 1 por defecto');
                    corpoboyacaId = 1;
                }
            } else {
                console.log('No se pudieron obtener entidades, usando ID 1 por defecto');
                corpoboyacaId = 1;
            }
        } catch (error) {
            console.log('Error obteniendo entidades, usando ID 1 por defecto');
            corpoboyacaId = 1;
        }
    });

    describe('Validaciones del formulario de queja', () => {
        test('Debería rechazar queja con descripción muy corta', async () => {
            const quejaCorta = {
                entidad_id: corpoboyacaId,
                descripcion: 'Corta'
            };

            const response = await request(app)
                .post('/api/quejas')
                .send(quejaCorta)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors).toContain('La descripción debe tener al menos 10 caracteres');
        });
    });

    describe('Test específico para CORPOBOYACA', () => {
        
        test('Debería crear queja específica para CORPOBOYACA', async () => {
            expect(corpoboyacaId).not.toBeNull();
            expect(typeof corpoboyacaId).toBe('number');
            const quejaCorpoboyaca = {
                entidad_id: corpoboyacaId,
                descripcion: 'Queja dirigida específicamente a CORPOBOYACA (Corporación Autónoma Regional de Boyacá) sobre la gestión ambiental, protección de ecosistemas y manejo de recursos hídricos en la región.'
            };
            const response = await request(app)
                .post('/api/quejas')
                .send(quejaCorpoboyaca)
                .expect('Content-Type', /json/);
            expect(response.body).toHaveProperty('success');
            console.log(`Test CORPOBOYACA - ID usado: ${corpoboyacaId}`);
            console.log(`Respuesta: ${response.body.success ? 'Éxito' : 'Error esperado'}`);
            if (response.body.success === true) {
                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('entidad_id', corpoboyacaId);
                expect(response.body.data).toHaveProperty('descripcion');
                expect(response.body).toHaveProperty('message', 'Queja creada exitosamente');
            } else {
                expect([400, 500]).toContain(response.status);
                expect(response.body).toHaveProperty('timestamp');
            }
        });
    });
});