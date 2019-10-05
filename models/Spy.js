var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    ip: String,
    action: [{
        ammount: Number,
        usernames: {
            type: [String],
            default: []
        },
        date: {
            type: Date,
            default: Date.now
        },
        importantActions: [{
            url: String,
            requestBody: Object,
            date: Date
        }]
    }],
});

module.exports = mongoose.model("spy", userSchema, "spy");