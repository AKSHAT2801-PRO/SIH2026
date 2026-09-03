const User = require("../model/user")

const register = async (req,res)=>{

    try{
        const body = await req.body
        newUser = new User(body)
        const result = await newUser.save()
        console.log("User added successfully",result);
        
        res.json({message : "Fetch Successful"})
    }
    catch(e){
        console.log("Error: ",e)
        res.status(300).json({message : "Fetch Unsuccessful"})
    }
    
}

module.exports = {register}