//const { tr } = require("@faker-js/faker");
var mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
    username: {type: String, index: true, required: true, unique: true, trim: true, lowercase: true, min: 3, max: 50 },
    role: {type: String, enum: ['admin', 'student', 'faculty'], default: 'student'},
});

userSchema.pre('save', function(next) {
    if (!this.isNew && this.isModified('username')) {
        return next(new Error('Cannot change the username of an existing user.'));
    }
    next();
})

userSchema.plugin(passportLocalMongoose);

//module.exports = mongoose.model("User", userSchema);
module.exports = userSchema;