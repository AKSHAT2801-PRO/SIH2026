const mongoose = require("mongoose")

async function connectDb(url){
    return mongoose.connect(url).then(()=>{
        console.log("Connected to MOngoDB Database: AgroW")
    }).catch((err)=>{
        console.log("Error connecting to MongoDB Database: ", err)
    })
}

module.exports = {connectDb};