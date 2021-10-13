const request = require('supertest')
const app = require('../src/app')

describe('Contracts endpoints', () => {

    test('Should get user contracts when authenticated', async () => {
        const response = await request(app)
            .get('/contracts/1')
            .set('profile_id', 1)
        
        expect(response.statusCode).toBe(200)
    })

    test('Should not return a contract if does not belongs to user', async () => {
        const response = await request(app)
            .get('/contracts/1')
            .set('profile_id', 2)
        
        expect(response.statusCode).toBe(403)
    })

    test('Should get 401 when not authenticated', async () => {
        const response = await request(app)
            .get('/contracts/1')
        
        expect(response.statusCode).toBe(401)
    })

    test('should list all user contracts', async () => {
        const response = await request(app)
            .get('/contracts')
            .set('profile_id', 1)

        expect(response.statusCode).toBe(200)
    })

    test('Should not list all user contracts if not authenticated', async () => {
        const response = await request(app)
            .get('/contracts')

        expect(response.statusCode).toBe(401)
    })
})