const express = require('express')
const User = require('../models/User')
const { auth, admin } = require('../middleware/auth')
const config = require('../../config.json')
const Register = require('../chain/register')
const shamirShare = require('../shamir')
var multer  = require('multer')
const {OAuth2Client} = require('google-auth-library');

const router = express.Router()
const client = new OAuth2Client("887688664674-jqpj4g1ap81heko2lcchg79venfitm52.apps.googleusercontent.com");

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

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "887688664674-jqpj4g1ap81heko2lcchg79venfitm52.apps.googleusercontent.com"
  });
  const payload = ticket.getPayload();
  if(payload['hd'] !== "nitc.ac.in") throw new Error();
  return payload;
}


router.post('/users/login', async(req, res) => {
    //Login a registered user
    try {
        const { id_token } = req.body
        const payload = await verify(id_token)
        var user = await User.findByEmail(payload['email'])
        if (user == -1) {
            user = new User({
                email: payload['email'],
                first_name: payload['given_name'],
                last_name: payload['family_name'],
                tokens: [],
                eligible_elections: []
            })
	    await user.save()
        }
        const token = await user.generateAuthToken()
        response = {
            token,
            user: user.first_name + " " + user.last_name,
            pic: payload['picture']
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


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/home/reema/Downloads/finalV3')
  },
  filename: function (req, file, cb) {
   //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })



//var upload = multer({ dest: '/home/reema/Downloads/finalV3' })
router.post('/users/me/registerusers',upload.single('file'), async (req, res) => {

   // req.file is the name of your file in the form above, here 'uploaded_file'
   // req.body will hold the text fields, if there were any 
   const {electionId}=req.body
   console.log(req.filename,req.body)
   console.log(electionId)

    
});


module.exports = router
