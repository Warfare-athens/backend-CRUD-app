const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        default:Date.now
    },
    caption:String,
    img:String,
    likes:[{type:mongoose.Schema.Types.ObjectId , ref:"user"}]
})

module.exports = mongoose.model("post" , postSchema)