const { getContractById, getAllContracts } = require('../handlers/contract')
const { getUnpaidJobs, payJob } = require('../handlers/job')
const { makeDeposit } = require('../handlers/balance')
const { bestProfessions, bestClients } = require('../handlers/admin')
const { getProfile } = require('../middleware/getProfile')

module.exports = (app) => {
    // Contracts
    app.get('/contracts/:id', getProfile, getContractById)
    app.get('/contracts', getProfile, getAllContracts)

    // Jobs
    app.get('/jobs/unpaid', getProfile, getUnpaidJobs)
    app.post('/jobs/:job_id/pay', getProfile, payJob)

    // Balances
    app.post('/balances/deposit/:userId', getProfile, makeDeposit)

    // Admin Reports
    app.get('/admin/best-profession', getProfile, bestProfessions)
    app.get('/admin/best-clients', getProfile, bestClients)
}