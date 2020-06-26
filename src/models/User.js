const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../../config.json')

const userSchema = mongoose.Schema({first_name: String, last_name: String, mobile: String, email: String, password: String, 
    tokens:[{token: String}], eligible_elections: [{id : String, submitted: Boolean}], otp: String, otpStartTime: String, admin: Boolean });

userSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({_id: user._id}, config.JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByEmail = async (email) => {
    // Search for a user by email and password.
    const user = await User.findOne({ email } );
    if (!user) {
        return -1;
    }
    return user
}

const User = mongoose.model('User', userSchema, 'User')

module.exports = User
