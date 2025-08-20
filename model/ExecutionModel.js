var mongoose = require("mongoose");

var executionSchema = mongoose.Schema({
    studentName: {type: String, required: true, minlength: 3, maxlength: 50},
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    zipFilePath: {type: String, required: true, minlength: 1, maxlength: 500},
    createdAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    executionTime: {type: Number, default: -1},
    grade: {type: Number, default: -1, min: -1, max: 1000},
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    feedbackPath: {type: String, default: "", minlength: 0, maxlength: 500},
    feedback: {type: String, default: "Feedback not available yet."},
});

//module.exports = mongoose.model("Execution", executionSchema);
module.exports = executionSchema;