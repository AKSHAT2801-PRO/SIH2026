const express = require("express")
const cors = require("cors")
const authRoute = require("./routes/auth")
const mpsRoute = require("./routes/mps")
const { connectDb } = require("./config/dbconfig")
// const { addAllMps } = require("./repository/add_mp")
const app = express()
const port = 6005
require("dotenv").config()

app.use(cors({
  origin: ["http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.1.100:3000",
      "http://0.0.0.0:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Database connection (MONGO DB)
connectDb(process.env.MongoDB_URL)

app.get("/",(req,res)=>{
    res.send("<h1> Hello There!!! Work in Progress")
})
app.use("/auth",authRoute)
app.use("/mps",mpsRoute)

app.listen(port,(err)=>{
    console.log(err)
})
