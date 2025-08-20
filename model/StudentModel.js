var mongoose = require("mongoose");

var studentNumSchema = mongoose.Schema({
    studentNum: {type: String, required: true, unique: true, trim: true, immutable: true, lowercase: true, match: /^[0-9]{9}$/},
    email: {type: String, required: true, trim: true, immutable: true, lowercase: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/},
    username: {type: String, required: true, unique: true, trim: true, immutable: true, lowercase: true, minlength: 3, maxlength: 50, match: /^[a-zA-Z0-9._-]+$/},
});

//module.exports = mongoose.model("StudentNum", studentNumSchema);
module.exports = studentNumSchema;