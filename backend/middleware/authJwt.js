const { validateUser, verifyToken } = require("../service/auth");

const authenticate = async (req,res,next)=>{
    const token = req.cookies.ticket;
    if(!token){
        req.user = null
        return next()
    }
    try{
        const decodedToken = await verifyToken(token)
        console.log(decodedToken)
        req.user = decodedToken
        

    }catch(e){
        console.log("Error",e)
        req.user = null
    }
    return next()
}
module.exports = {authenticate}