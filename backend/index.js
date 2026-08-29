const express = require("express")
const authRoute = require("./routes/auth")
const { connectDb } = require("./config/dbconfig")
const { addAllMps } = require("./repository/add_mp")
const app = express()
const port = 6005
require("dotenv").config()


// Database connection (MONGO DB)
connectDb(process.env.MongoDB_URL)

app.get("/",(req,res)=>{
    res.send("<h1> Hello There!!! Work in Progress")
})
app.use("/auth",authRoute)

addAllMps()

app.listen(port,(err)=>{
    console.log(err)
})
