const express = require("express")
const authRoute = require("./routes/auth")
const app = express()
const port = 6005

app.get("/",(req,res)=>{
    res.send("<h1> Hello There!!! Work in Progress")
})
app.use("/auth",authRoute)


app.listen(port,(err)=>{
    console.log(err)
})
