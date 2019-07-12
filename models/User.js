var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    access_token: String,
    access_expire: Date,
    refresh_token: String,
    refresh_expire: Date,
    vip: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("user", userSchema, "user");