const express = require('express')
const User = require('../models/User')
const { auth, admin } = require('../middleware/auth')
const config = require('../../config.json')
const Register = require('../chain/register')
const shamirShare = require('../shamir')

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
        var otp = generateOTP()
        var mobile = req.user.mobile
        var mssg = await sendSMS(mobile, otp)

        var d = new Date();
        var time = d.getTime();

        req.user.otp = otp
        req.user.otpStartTime= time
        await req.user.save()
		res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/me/verifyOTP', auth, async (req, res) => {
    try {
        const { otpInp, ethAcctInp, electionId } = req.body

        var d = new Date();
        var time = d.getTime();
        startTime = parseInt(req.user.otpStartTime)
        endTime = startTime+180000
        var otp = req.user.otp
        req.user.otp = null;
        await req.user.save();
        //3 min= 3*60*1000
        if(time > endTime)
            return res.status(401).send({error: 'Time exceeded for OTP verification'})

        if(otp != otpInp)
            return res.status(401).send({error: 'Incorrect OTP', inputOtp: otpInp})

        await Register(electionId, ethAcctInp);
        req.user.eligible_elections = req.user.eligible_elections.map((election, idx) => {
            if (election.id !== electionId) return election;
            else {election.submitted = true; return election;}
        })
        await req.user.save();
        res.send();

    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/users/me/logout', auth, async (req, res) => {
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

router.get('/users/me/logoutall', auth, async(req, res) => {
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
    res.send(req.user.eligible_elections)
})

router.post('/shamirshare', auth, admin, async(req, res) => {
    res.send(shamirShare(req.body.emails));
})

module.exports = router
