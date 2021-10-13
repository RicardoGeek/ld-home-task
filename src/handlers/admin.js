const moment = require('moment')
const errors = require('./error')
const { Op } = require("sequelize")

const bestProfessions = async (req, res) => {
    const startDate = req.query.start
    const endDate = req.query.end

    if (validateDateRange(startDate, endDate)) {
        const start = moment(startDate, 'DD-MM-YYYY')
        const end = moment(endDate, 'DD-MM-YYYY')

        const { Job, Contract } = req.app.get('models')

        const paidJobs = await Job.findAll({
            include: [
                {
                    model: Contract
                }
            ],
            where: {
                paid: {
                    [Op.eq]: true
                },
                paymentDate: {
                    [Op.between]: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
                }
            }
        })

        // map money to profession
        const moneyProfessionMap = await Promise.all(
            paidJobs.map(async pj => await getJobProfession(req, pj))
        )

        const reportMap = new Map()

        moneyProfessionMap.map(mpm => {
            if (reportMap.has(mpm.profession)) {
                const entry = reportMap.get(mpm.profession)
                const value = (entry + mpm.amount)
                reportMap.set(mpm.profession, value)
            } else {
                reportMap.set(mpm.profession, mpm.amount)
            }
        })
        
        const sorted = [... reportMap.entries()].sort((a,b) => b[1] - a[1])

        res.send(sorted.map(e => {
            return {
                profession: e[0],
                amountEarned: e[1]
            }
        }))

    } else {
        res
            .status(400)
            .send(errors.badRequest('Invalid date range'))
            .json()
            .end()
    }
}

const bestClients = async (req, res) => {
    const startDate = req.query.start
    const endDate = req.query.end
    const limit = req.query.limit || 2

    if (validateDateRange(startDate, endDate)) {
        const start = moment(startDate, 'DD-MM-YYYY')
        const end = moment(endDate, 'DD-MM-YYYY')

        const { Job, Contract } = req.app.get('models')

        const paidJobs = await Job.findAll({
            include: [
                {
                    model: Contract
                }
            ],
            where: {
                paid: {
                    [Op.eq]: true
                },
                paymentDate: {
                    [Op.between]: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
                }
            },
            limit
        })

        // money to client map
        const moneyClientMap = await Promise.all(
            paidJobs.map(async pj => {
            const profile = await getClientPayments(req, pj)
            return {
                id: profile.id,
                fullName: profile.fullName,
                paid: pj.price
            }
        }))

        const reportMap = new Map()

        moneyClientMap.map(mcp => {
            if(reportMap.has(mcp.id)) {
                const entry = reportMap.get(mcp.id)
                const amount = entry.paid + mcp.paid
                reportMap.set(mcp.id, {
                    fullName: entry.fullName,
                    paid: amount
                })
            } else {
                reportMap.set(mcp.id, {
                    fullName: mcp.fullName,
                    paid: mcp.paid
                })
            }
        })

        const sorted = [... reportMap.entries()].sort((a, b) => b[1].paid - a[1].paid)
        
        res.send(sorted.map(e => {
            return {
                id: e[0],
                fullName: e[1].fullName,
                paid: e[1].paid
            }
        }))


    } else {
        res
            .status(400)
            .send(errors.badRequest('Invalid date range'))
            .json()
            .end()
    }
}

// privates
const validateDateRange = (start, end) => {
    const startDate = moment(start, 'DD-MM-YYYY')
    const endDate = moment(end, 'DD-MM-YYYY')

    return startDate.isValid() &&
            endDate.isValid()  &&
            moment(startDate).isBefore(endDate)
}


const getJobProfession = async (req, job) => {
    const { Profile } = req.app.get('models')

    const profile = await Profile.findOne({
        where: {
            id: {
                [Op.eq]: job.Contract.ContractorId
            }
        }
    })
    
    return {
        profession: profile.profession,
        amount: job.price
    }
}

const getClientPayments = async (req, job) => {
    const { Profile } = req.app.get('models')

    const profile = await Profile.findOne({
        where: {
            id: {
                [Op.eq]: job.Contract.ClientId
            }
        }
    })

    return {
        id: profile.id,
        fullName: `${profile.firstName} ${profile.lastName}` 
    }
}

module.exports = {
    bestProfessions,
    bestClients
}