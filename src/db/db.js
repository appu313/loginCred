const mongoose = require('mongoose')
const config = require('../../config.json')
mongoose.connect(config.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
}, (error) => {
	if(!error)
		console.log("Success");
	else
		console.log("Error connecting to DB");
})
