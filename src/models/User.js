const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../../config.json')

const userSchema = mongoose.Schema({first_name: String, last_name: String, mobile: String, email: String, password: String, 
    tokens:[{token: String}], otp: String, ethAcct: String, otpStartTime: String }, { collection : 'voterList' });

userSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({_id: user._id}, config.JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    // Search for a user by email and password.
    const user = await User.findOne({ email} );
    if (!user) {
        return -1;
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    //const isPasswordMatch = password == user.password;
    if (!isPasswordMatch) {
        return -2;
    }
    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
