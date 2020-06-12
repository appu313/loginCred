const express = require('express')
const userRouter = require('./routers/user')

const config = require('../config.json')
const port = config.PORT
require('./db/db')

const app = express()

app.use(express.json())
app.use(userRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
