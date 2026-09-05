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

const login = async (req, res) => {
    try {
        const body = req.body;
        const user = await authService.validateUser(body);

        if (!user) {
            return res.status(400).json({ message: "Invalid email, password, or role" });
        } else {
            const token = await authService.getUserToken(user);
            res.cookie("ticket", token, {
                httpOnly: false,
                sameSite: "lax",
            });
            return res.status(200).json({
                message: "Login Successful",
                role: user.role,
                name: user.name,
                email: user.email,
            });
        }
    } catch (e) {
        console.log("Error: ", e);
        return res.status(500).json({ message: "Login failed" });
    }
};

const logout = async (req, res) => {
    res.clearCookie("ticket");
    return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, logout };