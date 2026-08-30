const mps = require("../model/mp")
const getAllMps = async (req,res)=>{

    try{
        const page = req.query.page
        const limit = req.query.limit
        const skip = (page - 1) * limit

        const data = await mps.find({})
        .skip(skip)
        .limit(limit)
        res.json(data)
    }
    catch(error){
        console.log(error)
    }
    
}


module.exports = {getAllMps}