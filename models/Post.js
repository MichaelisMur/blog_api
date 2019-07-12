var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    img: String,
    hiddenColor: String,
    hiddenColorOpacity: String,
    hiddenText: String,
    hiddenTextSize: String,
    hiddenTextColor: String,
    header: String,
    comments: [],
    authCode: Number,
    unauthCode: Number,
});

module.exports = mongoose.model("post", userSchema, "post");