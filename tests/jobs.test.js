const request = require('supertest')
const app = require('../src/app')

describe('Jobs endpoints', () => {
    test('Should return all unpaid jobs', async () => {
        const response = await request(app)
            .get('/jobs/unpaid')
            .set('profile_id', 1)
        
        expect(response.statusCode).toBe(200)
    })

    test('Should not return all unpaid jobs if not authenticated', async () => {
        const response = await request(app)
            .get('/jobs/unpaid')
        
        expect(response.statusCode).toBe(401)
    })

    test('Should not be able to pay if you are a contractor', async () => {
        const response = await request(app)
            .post('/jobs/2/pay')
            .set('profile_id', 5)

        expect(response.statusCode).toBe(400)
    })

    test('Should not be able to pay not enough balance', async () => {
        const response = await request(app)
            .post('/jobs/5/pay')
            .set('profile_id', 4)

        expect(response.statusCode).toBe(400)
    })

    test('Should not be able to pay if job does not exists', async () => {
        const response = await request(app)
            .post('/jobs/20289348/pay')
            .set('profile_id', 1)

        expect(response.statusCode).toBe(404)
    })

    test('Should not be able to pay if job is already paid', async () => {
        const response = await request(app)
            .post('/jobs/8/pay')
            .set('profile_id', 2)

        expect(response.statusCode).toBe(400)
    })

    test('Should not be able to pay', async () => {
        const response = await request(app)
            .post('/jobs/2/pay')
            .set('profile_id', 1)

        expect(response.statusCode).toBe(200)
    })
})