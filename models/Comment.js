var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("comment", commentSchema, "comment");