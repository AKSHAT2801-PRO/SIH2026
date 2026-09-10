const authService = require ("../service/auth")

const register = async (req,res)=>{

    try{
        const body = req.body
        if (body.role === "citizen" && (!body.place?.region || !body.place?.district)) {
            return res.status(400).json({ message: "Citizens must select a region and district" });
        }
        if (body.role === "mp" && !/^[^\s@]+@(?:[^\s@.]+\.)?mplad\.ac\.in$/i.test(body.email || "")) {
            return res.status(400).json({ message: "MP email must use the mplad.ac.in domain" });
        }
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
        if (body.role === "mp" && !/^[^\s@]+@(?:[^\s@.]+\.)?mplad\.ac\.in$/i.test(body.email || "")) {
            return res.status(400).json({ message: "MP email must use the mplad.ac.in domain" });
        }
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
                place: user.role === "citizen" ? user.place : undefined,
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

const me = async (req, res) => {
    if (!req.user?.id) return res.status(401).json({ message: "Authentication required" });
    const user = await authService.getUserProfile(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        place: user.place,
    });
};

module.exports = { register, login, logout, me };