const express = require("express")
const router = express.Router()
const mps = require("../model/mp")
const {getMps} = require ("../controller/mps")
router.get('/',getMps)


module.exports = router
