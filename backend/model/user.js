const mongoose = require ("mongoose")

const userSchema = new mongoose.Schema({
    role : {
        type : String,
        required : true,
        trim : true
    },
    name: {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        trim : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
        trim : true
    },
    place: {
        type: new mongoose.Schema({
            region: {
                type: String,
                trim: true,
                required: true
            },
            district: {
                type: String,
                trim: true,
                required: true
            }
        }, { _id: false }),
        required: function () { return this.role === "citizen"; }
    }
})

module.exports = mongoose.model("User",userSchema)