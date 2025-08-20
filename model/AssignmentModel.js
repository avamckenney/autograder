const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
        unique: true,
        trim: true,
        match: /^[a-zA-Z0-9-_.]+$/, // Allow alphanumeric characters, hyphens, underscores, periods
    },
    maxGrade:{
        type: Number,
        required: true,
        min: 0, // Minimum grade of 0
        max: 1000, // Maximum grade of 1000
        default: 100 // Default maximum grade is 100
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required:true
    },
    expectedZipName: {
        type: String,
        default: "submission.zip", // Default expected zip name
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true,
        match: /^[a-zA-Z0-9-_.]+$/, // Allow alphanumeric characters, hyphens, underscores, periods
    },
    resources: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 250,
        trim: true,
        match: /^[a-zA-Z0-9-_/.]+$/, // Allow alphanumeric characters, hyphens, underscores, slashes, and dots
    },
    command: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500,
        trim: true
    },
    imageName: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100,
        trim: true,
    },
    maxSize: {
        type: Number,
        default: 50 * 1024 * 1024,
        min: 1, // Minimum size of 1 byte
        max: 100 * 1024 * 1024 // Maximum size of 100 MB
    },
    timeout: {
        type: Number,
        default: 10, // Default timeout of 10 seconds
        min: 1, // Minimum timeout of 1 second
        max: 600 // Maximum timeout of 10 minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date,
        default: null // Default to no deadline
    },
    extraSubmissionsPenaltyUnit: {
        type: String,
        enum: ['none', 'percent', 'points'],
        default: 'none' // Default to no penalty
    },
    extraSubmissionsPenalty: {
        type: Number,
        default: 0, // Default penalty value is 0
        min: 0 // Minimum penalty value of 0
    },
    freeSubmissions: {
        type: Number,
        default: 0, // Default to unlimited free submissions
        min: 0 // Minimum free submissions of 0
    }
});

assignmentSchema.index({ name: 1 }, { unique: true });
assignmentSchema.pre('save', function(next) {
    if (!this.isNew && this.isModified('name')) {
        return next(new Error('Cannot change the name of an existing assignment'));
    }
    next();
})

assignmentSchema.statics.findByName = async function(assignmentName) {
    let result = await this.findOne({name: assignmentName}).exec();
    return result;
}

//module.exports = mongoose.model('Assignment', assignmentSchema);
module.exports = assignmentSchema;