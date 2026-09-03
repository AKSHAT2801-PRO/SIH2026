const authService = require ("../service/auth")

const register = async (req,res)=>{

    try{
        const body = await req.body
        const token = await authService.setUser(body)
        res.cookie("uid",token)
        res.json({message : "Fetch Successful"})
    }
    catch(e){
        console.log("Error: ",e)
        res.status(300).json({message : "Fetch Unsuccessful"})
    }
    
}

module.exports = {register}