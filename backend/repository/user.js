const User = require("../model/user")

const setUser = async (data) =>{
    newUser = new User(data)
    const result = await newUser.save()
    console.log(result);
    return result;
}

const getUser = async (data) =>{
    const user = await User.findOne({
        role:data.role,
        email: data.email,
        password: data.password
    });
    return user;
}

module.exports = {setUser, getUser}