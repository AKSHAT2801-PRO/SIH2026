const express = require("express")
const router = express.Router()
const mps = require("../model/mp")
const {getAllMps} = require ("../controller/mps")
router.get('/',getAllMps)



module.exports = router
