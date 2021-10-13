const notFound = () => {
    return {
        status: 'error',
        message: 'The resource you are looking for is not found'
    }
}

const forbidden = () => {
    return {
        status: 'error',
        message: 'You don\'t have permissions to access this resource'
    }
}

const badRequest = (custom) => {
    return {
        status: 'error',
        message: custom
    }
}

module.exports = {
    notFound,
    forbidden,
    badRequest
}