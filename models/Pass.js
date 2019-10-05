var mongoose = require("mongoose");

var passSchema = new mongoose.Schema({
    username: String,
    password: String,
});

module.exports = mongoose.model("pass", passSchema, "pass");