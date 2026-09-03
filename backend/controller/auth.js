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

const login = async (req,res)=>{
    try{
        const body = await req.body

        const user = await User.findOne({
            email: body.email,
            password: body.password
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        res.json({
            message: "Login successful",
            user: user
        });
    }   catch (e){
            console.log("Error: ", e);
            res.status(500).json({message: "Login failed"});
        };
} 

module.exports = {register, login}