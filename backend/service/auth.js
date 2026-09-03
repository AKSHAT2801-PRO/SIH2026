const jwt = require("jsonwebtoken")
const repo = require("../repository/user")

const setUser = async (data) => {
    const result = await repo.setUser(data)
    console.log("User added successfully",result);
    const payload = {role: data.role, id:result._id.toString(),email : data.email}
    const token = jwt.sign(payload,process.env.JWT_Secret)
    return token
}

module.exports = {setUser}