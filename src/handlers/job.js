const errors = require('./error')
const { Op } = require("sequelize")
const moment = require('moment')

/**
 * @returns all unpaid jobs given a profile id
 */
const getUnpaidJobs = async (req, res) => {
    const profileType = req.profile.type
    const profileId = req.profile.id

    if(!profileId) {
        return res 
            .status(401)
            .send(errors.forbidden())
    }

    const jobs = await findActiveJobsByOwnerId(profileId, profileType, req)

    return res.json(jobs)
}

/**
 * @returns Pay for a given job
 */
const payJob = async (req, res) => {
    const { Job, Contract, Profile } = req.app.get('models')

    const profileType = req.profile.type
    const profileId = req.profile.id
    const { job_id } = req.params

    if (profileType === 'client') {
        const currentBalance = req.profile.balance
        const job = await Job.findOne({
            include: [
                {
                    model: Contract,
                    where: {
                        ClientId: {
                            [Op.eq]: profileId
                        },
                        status: {
                            [Op.ne]: 'terminated'
                        }
                    }
                }
            ],
            where: {
                id: job_id
            }
        })

        if(!job) {
            return res
                .status(404)
                .send(errors.notFound())
                .json()
                .end()
        }

        const jobPrice = job.price


        if(!job.paid) {
            // pay
            if(currentBalance >= jobPrice) {
                const newBalance = currentBalance - jobPrice
                
                // Pay the job
                await Job.update({
                    paid: true,
                    paymentDate: moment().toDate()
                }, {
                    where: {
                        id: job_id
                    }
                })

                // update client balance
                await Profile.update({
                    balance: newBalance,
                }, {
                    where: {
                        id: profileId
                    }
                })

                // update contractor balance
                await Profile.increment('balance', {
                    by: jobPrice,
                    where: {
                        id: {
                            [Op.eq]: job.Contract.ContractorId
                        }
                    }
                })
            } else {
                return res
                    .status(400)
                    .send(errors.badRequest('Account has insuficient balance'))
                    .json()
                    .end()
            }
        } else {
            return res
                .status(400)
                .send(errors.badRequest('This job is already paid'))
                .json()
                .end()
        }


        return res.send({
            status: 'ok',
            message: `Job with id: ${job_id} has been paid succesfully`
        })
    } else {
        return res
                .status(400)
                .send(errors.badRequest('This job id was not found for this client'))
                .json()
                .end()
    }
}

/*
 * PRIVATE METHODS
 */
const findActiveJobsByOwnerId = async (ownerId, profileType, req) => {
    const { Job, Contract } = req.app.get('models')

    let whereStatement = {}

    if (profileType === 'client') {
        whereStatement = {
            [Op.and]: [
                {
                    ClientId: ownerId,
                },
                {
                    status: {
                        [Op.ne]: 'terminated'
                    }
                }
            ]
        }
    }

    if (profileType === 'contractor') {
        whereStatement = {
            [Op.and]: [
                {
                    ContractorId: ownerId,
                },
                {
                    status: {
                        [Op.ne]: 'terminated'
                    }
                }
            ]
        }
    }

    const jobs = await Job.findAll({
        include: [
            {
                model: Contract,
                where: whereStatement
            }
        ],
        where: {
            paid: null
        }
    })

    return jobs
}



module.exports = {
    getUnpaidJobs,
    payJob
}