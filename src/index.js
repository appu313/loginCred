const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/newDB",{ useNewUrlParser: true , useUnifiedTopology: true }, (error) => {
	if(!error)
		console.log("Success");
	else
		console.log("Error connecting to testDB");
})