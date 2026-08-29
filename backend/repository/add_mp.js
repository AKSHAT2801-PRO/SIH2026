const mp = require("../model/mp")
const data = require ("../../data/allMps.json")

const addAllMps = async (req, res)=>{
    await mp.insertMany(data)
    console.log("Data inserted successfully");
}

module.exports = {addAllMps}