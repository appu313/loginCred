const express = require('express')
const userRouter = require('./routers/user')

const config = require('../config.json')
const port = config.PORT
require('./db/db')

const app = express()

const cors = require('cors');
app.use(cors());

app.use(express.json())
app.use(userRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
