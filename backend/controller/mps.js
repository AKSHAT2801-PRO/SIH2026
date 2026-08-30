const mps = require("../model/mp")
const getMps = async (req,res)=>{
    try{
        const page = req.query.page
        const limit = req.query.limit
        const name = req.query.name
        if (!name){
            const skip = (page - 1) * limit
            const data = await mps.find({})
            .skip(skip)
            .limit(limit)
            res.json(data)
        }
        else{
            const data = await mps.find({mpName : name})
            res.json(data)
        }
    }
    catch(error){
        console.log(error)
    }
    
}

module.exports = {getMps}