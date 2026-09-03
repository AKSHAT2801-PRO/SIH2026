const jwt = require("jsonwebtoken")
const repo = require("../repository/user")

const setUser = async (data) => {
    const result = await repo.setUser(data)
    console.log("User added successfully",result);
    const payload = {role: data.role, id:result._id.toString(),email : data.email, password:data.password}
    const token = jwt.sign(payload,process.env.JWT_Secret)
    return token
}

const verifyToken = async (token) =>{
    const decoded = await jwt.verify(token,process.env.JWT_Secret)
    return decoded
}

const validateUser = async (data) => {
    try{
        const user = await repo.getUser(data)
        if (!user) {
            return false;
        }
        return true;
        
    } catch (e){
        console.log("Error: ",e);
    }

}

module.exports = {setUser, validateUser,verifyToken}