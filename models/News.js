var mongoose = require("mongoose");

var newsSchema = new mongoose.Schema({
    title: String,
    body: String,
    link: String,
    date: {
        type: Date,
        default: Date.now
    },
    deleted: {
        type: Boolean,
        default: false
    },
    vip: Number
});

module.exports = mongoose.model("news", newsSchema, "news");