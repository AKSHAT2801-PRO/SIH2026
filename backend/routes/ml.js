const express = require("express");
const router = express.Router();
const { predict } = require("../controller/ml");

router.post("/predict", predict);

module.exports = router;