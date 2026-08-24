const express = require("express")
const router = express.Router()

router.get("/",(req,res)=> res.send("Authentication is Pending"))

module.exports = router