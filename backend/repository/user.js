const User = require("../model/user")

const setUser = async (data) =>{
    newUser = new User(data)
    const result = await newUser.save()
    console.log(result);
    return result;
}

module.exports = {setUser}