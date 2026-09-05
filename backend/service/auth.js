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

const getUserToken = async (dataOrUser) => {
    let user = dataOrUser._id ? dataOrUser : await repo.getUser(dataOrUser);
    if (user) {
        const payload = { role: user.role, id: user._id.toString(), email: user.email };
        const token = jwt.sign(payload, process.env.JWT_Secret);
        return token;
    }
    return null;
};

const validateUser = async (data) => {
    try {
        const user = await repo.getUser(data);
        return user || null;
    } catch (e) {
        console.log("Error: ", e);
        return null;
    }
};

module.exports = {setUser, validateUser,verifyToken,getUserToken}