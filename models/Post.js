var mongoose = require("mongoose");

var ToySchema = new mongoose.Schema({
    username: String,
    comment: String,
    date: Date,
    available: {
        type: Boolean,
        default: true
    },
    restore_expire: Date
});

var userSchema = new mongoose.Schema({
    img: String,
    hiddenColor: String,
    hiddenColorOpacity: String,
    hiddenText: String,
    hiddenTextSize: String,
    hiddenTextColor: String,
    header: String,
    comments: [ToySchema],
    authCode: Number,
    unauthCode: Number,
    date: {
        type: Date,
        default: Date.now
    },
    img: String,
    audio: String,
    show: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("post", userSchema, "post");