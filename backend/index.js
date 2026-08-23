const express = require("express")
const app = express()
const port = 6005

app.get("/",(req,res)=>{
    res.send("<h1> Hello There!!! Work in Progress")
})

app.listen(port,(err)=>{
    console.log(err)
})
