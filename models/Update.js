var mongoose = require('mongoose');

var updateSchema = new mongoose.Schema({
    text: String,
    project: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project"
        },

        name: String
    },
    author: {
        id: {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }, 
        username: String
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Update", updateSchema);