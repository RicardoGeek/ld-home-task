const errors = require('./error')
const { Op } = require("sequelize")

/**
 * @returns contract by id
 */
const getContractById = async (req, res) => {
    const { Contract } = req.app.get('models')
    const { id } = req.params

    const profileType = req.profile.type

    const contract = await Contract.findOne({
        where: {
            id
        }
    })

    if (!contract) {
        return res
            .status(404)
            .json(errors.notFound())
            .end()
    }

    if (
        (profileType === 'client' && contract.ClientId !== req.profile.id) || 
        (profileType === 'contractor' && contract.ContractorId !== req.profile.id)) {
        return res
            .status(403)
            .send(errors.forbidden())
            .end()
    }

    return res.json(contract)
}

/**
 * @returns a list of contracts given a profile id
 */
const getAllContracts = async (req, res) => {
    const { Contract } = req.app.get('models')

    const profileType = req.profile.type
    let whereStatement = {}

    if (profileType === 'client') {
        whereStatement = {
            [Op.and]: [
                {
                    ClientId: req.profile.id,
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
                    ContractorId: req.profile.id,
                },
                {
                    status: {
                        [Op.ne]: 'terminated'
                    }
                }
            ]
        }
    }

    const contract = await Contract.findAll({
        where: whereStatement
    })

    if (!contract) {
        return res
            .status(404)
            .json(errors.notFound())
            .end()
    }

    return res.json(contract)
}

module.exports = {
    getContractById,
    getAllContracts
}