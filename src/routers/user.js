const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const config = require('../../config.json')

const twilioClient = require('twilio')(config.accountSid, config.authToken);
const router = express.Router()

function generateOTP(){
    var n = Math.floor(100000 + Math.random() * 900000)
    return n.toString();
}

async function sendSMS(number, newOtp){
    mssg = 'OTP for nitcVote: '+newOtp
    return twilioClient.messages
    .create({
     body: mssg,
     from: '+12054985785',
     to: number
   })
}

/*******not used*************/
router.post('/users', async (req, res) => {
    // Create a new user
    try {
        const user = new User(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})
/*******************************/

router.post('/users/login', async(req, res) => {
    //Login a registered user
    try {
        const { email, password } = req.body
        const user = await User.findByCredentials(email, password)
        if (!user) {
            return res.status(401).send({error: 'Login failed! Check authentication credentials'})
        }
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (err) {
        res.status(400).send({error: "Authentication error"})
    }

})

router.get('/users/me', auth, async(req, res) => {
    // View logged in user profile
    res.send(req.user)
})

router.post('/users/me/sendOTP', auth, async (req, res) => {
    try {

        var val = generateOTP()
        var mobile = req.user.mobile
        var mssg = await sendSMS(mobile, val)

        var d = new Date();
        var time = d.getTime();
        

        req.user.otp = val
        req.user.otpStartTime= time
        await req.user.save()
        res.send({otp: val, sid: mssg.sid, time: time})
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/me/verifyOTP', auth, async (req, res) => {
    try {
        const {otpInp, ethAcctInp } = req.body
        var d = new Date();
        var time = d.getTime();
        startTime = parseInt(req.user.otpStartTime)
        endTime = startTime+180000
        if(time > endTime)
            return res.status(401).send({error: 'Time exceeded for otp verification'})

        var otp = req.user.otp
        if(otp != otpInp)
            return res.status(401).send({error: 'Invalid otp'})

        req.user.ethAcct = ethAcctInp
        await req.user.save()
        res.send({userDetails: req.user, startTime: startTime, endTime: endTime, currTime: time})

    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/me/logout', auth, async (req, res) => {
    // Log user out of the application
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/me/logoutall', auth, async(req, res) => {
    // Log user out of all devices
    try {
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router
