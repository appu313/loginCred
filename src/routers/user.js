const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const config = require('../../config.json')

const router = express.Router()

function generateOTP(){
    var otp_number = Math.floor(100000 + Math.random() * 900000)
    return otp_number.toString();
}

async function sendSMS(number, newOtp){
    const twilioClient = require('twilio')(config.accountSid, config.authToken);
    mssg = 'OTP for NITCVote: ' + newOtp;
    return twilioClient.messages
    .create({
     body: mssg,
     from: config.twilioNumber,
     to: number
   })
}

router.post('/users/login', async(req, res) => {
    //Login a registered user
    try {
        const { email, password } = req.body
        const user = await User.findByCredentials(email, password)
        if (user == -1) {
            return res.status(401).send({error: 'Login failed! Invalid email or password'})
        }
        if (user == -2) {
            return res.status(401).send({error: 'Login fail'})
        }
        const token = await user.generateAuthToken()
        response = {
            token,
            user: user.first_name + " " + user.last_name
        }
        res.send(response)
    } catch (err) {
        res.status(400).send({error: "Authentication error"})
    }

})

router.get('/users/me', auth, async(req, res) => {
    // View logged in user profile
    res.send(req.user)
})

router.get('/users/me/sendOTP', auth, async (req, res) => {
    try {
        var val = generateOTP()
        var mobile = req.user.mobile
        var mssg = await sendSMS(mobile, val)

        //int time = 
        var d = new Date();
        var time = d.getTime();
        

        req.user.otp = val
        req.user.otpStartTime= time
        await req.user.save()
		res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/me/verifyOTP', auth, async (req, res) => {
    try {
        const { otpInp, ethAcctInp } = req.body

        var d = new Date();
        var time = d.getTime();
        startTime = parseInt(req.user.otpStartTime)
        endTime = startTime+180000
        //3 min= 3*60*1000
        if(time > endTime)
            return res.status(401).send({error: 'Time exceeded for otp verification'})

        var otp = req.user.otp
        if(otp != otpInp)
            return res.status(401).send({error: 'Invalid otp', actOtp: otp, inputOtp: otpInp})

        req.user.ethAcct = ethAcctInp
        await req.user.save()
        res.send()

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

router.get('/users/me/eligible', auth, async(req, res) => {
    eligible_elections = req.user.eligible_elections
    var response = [];
    for (i in eligible_elections) {
        response.push(eligible_elections[i].id);
    }
    res.send(response)
})

module.exports = router
