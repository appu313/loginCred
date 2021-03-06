const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../../config.json')

const auth = async(req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '')
    const data = jwt.verify(token, config.JWT_KEY)
    try {
        const user = await User.findOne({ _id: data._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        res.status(401).send({ error: 'Invalid token: Not authorized to access this resource' })
    }

}

const admin = async(req, res, next) => {
    try {
        if (!req.user.admin) {
            throw new Error();
        }
        next();
    } catch (error) {
        res.status(401).send({ error: 'Invalid token: Not authorized to access this resource' })
    }

}

module.exports = { auth, admin }
