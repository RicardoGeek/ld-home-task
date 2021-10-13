const { Op } = require("sequelize")
const errors = require('./error')

const makeDeposit = async (req, res) => {
    const { userId } = req.params
    const { amount } = req.body
    const { Profile } = req.app.get('models')

    const profileId = req.profile.id.toString()

    if(userId === profileId) {
        const balanceDue = await getDueAmount(req)
        const depositLimit = (balanceDue * 0.25).toFixed(2)
        if (amount > depositLimit) {
            res
                .status(400)
                .send(errors.badRequest(`The amount you are trying to deposit exceeds your current limit of $${depositLimit}`))
                .end()
        } else {
            await Profile.increment('balance', {
                by: amount,
                where: {
                    id: {
                        [Op.eq]: userId
                    }
                }
            })

            const updatedProfile = await Profile.findOne({
                where: {
                    id: {
                        [Op.eq]: userId
                    }
                }
            })

            const newBalance = updatedProfile.balance

            res
                .status(200)
                .send({
                    status: 'ok',
                    message: `The requested deposit has been applied, your new balance is $${newBalance}`
                })
                .end()
        }

    } else {
        res
            .status(403)
            .send(errors.forbidden())
            .end()
    }
}

// privates
const getDueAmount = async (req) => {
    const { Job, Contract } = req.app.get('models')
    const jobs = await Job.findAll({
        include: [
            {
                model: Contract,
                where: {
                    ClientId: {
                        [Op.eq]: req.profile.id
                    },
                    status: {
                        [Op.ne]: 'terminated'
                    }
                }
            }
        ],
        where: {
            [Op.or]: {
                paid: {
                    [Op.eq]: false
                },
                paid: {
                    [Op.eq]: null
                }
            }
        }
    })

    const balanceDue = jobs.reduce((acc, amount, idx, j) => acc + j[idx].price, 0)
    return balanceDue
}

module.exports = {
    makeDeposit
}