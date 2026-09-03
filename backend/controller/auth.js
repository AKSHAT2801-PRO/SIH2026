const authService = require ("../service/auth")

const register = async (req,res)=>{

    try{
        const body = await req.body
        const token = await authService.setUser(body)
        res.cookie("ticket",token)
        res.json({message : "Fetch Successful"})
    }
    catch(e){
        console.log("Error: ",e)
        res.status(300).json({message : "Fetch Unsuccessful"})
    }
    
}

const login = async (req,res)=>{
    if (!req.user){
        try{
        
            const body = await req.body
            const result = await authService.validateUser(body);

            if(!result){
                res.status(400).json({message:"No user found"})
            }
            else{
                res.status(200).json({message:"Login Successful"})
            }
        } catch (e){
            console.log("Error: ", e);
            res.status(500).json({message: "Login failed"});
        };
    }
    res.status(200).json({message:"Login Successful"})
    
} 

module.exports = {register, login}