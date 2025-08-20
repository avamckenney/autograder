const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsPromises = fs.promises;
//const { setTimeout } = require('node:timers/promises');
const path = require('path');
const router = express.Router({ mergeParams: true });
const MAX_SUBMISSION_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_RESOURCES_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const assignmentExecutor = require('../assignmentexecutor');
const authCheck = require('../middleware/checkauth');
const dateFNS = require('date-fns');
const admZip = require('adm-zip');
const logger = require('../logger'); // Assuming logger.js is in the same directory

const mongoose = require('mongoose');
//const { arch } = require('os');
const executionModel = mongoose.model('Execution', require('../model/ExecutionModel'));
const assignmentModel = mongoose.model('Assignment', require('../model/AssignmentModel'));


const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = 'uploads/default'; // Default directory
        if(req.params.assignment){
            uploadDir = path.join('uploads', req.params.assignment);
        }

        // Create directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if(err){
                return cb(err);
            }
            return cb(null, uploadDir);
        });
    },
    /*filename: (req, file, cb) => {
        cb(null, file.originalname); // Use original file name
    }*/
});

const assignmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = 'resources/default'; // Default directory
        if(req.user){
            uploadDir = path.join('resources', req.user.username);
        }

        // Create directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if(err){
                return cb(err);
            }
            return cb(null, uploadDir);
        });
    },
    filename: (req, file, cb) => {
        if(req.body.name){
            cb(null, req.body.name + "-resources.zip"); // Use assignment name from body
        }else{
            //TODO: just deny?
            cb(new Error("An assignment name needs to be specified."), ""); // Use original file name
        }
    }
});

const submissionUpload = multer({ storage: submissionStorage, limits: { fileSize: MAX_SUBMISSION_FILE_SIZE }});
const assignmentUpload = multer({ storage: assignmentStorage, limits: { fileSize: MAX_RESOURCES_FILE_SIZE }});

router.param('assignment', async (req, res, next, assignmentId) => {
    try{
        if(!req.user || !req.user.username){
            logger.warn("Unauthorized access assignment attempt: " + (req.user ? req.user.username : "unknown"));
            return res.status(403).send('Unauthorized access.');
        }

        let assignmentDoc = await assignmentModel.findByName(assignmentId);
        
        if (!assignmentDoc) {
            return res.status(404).send('Assignment not found.');
        }
        req.assignmentDoc = assignmentDoc;
        next();
    } catch (error) {
        logger.error("Error fetching assignment:", error);
        logger.error(error.stack);
        return res.status(500).send("Error fetching assignment. Try again.");
    }
});

router.post('/:assignment/update', authCheck.checkRolePermission("admin"), assignmentUpload.single('resourcesZip'), async function(req, res){
    try{
        await req.assignmentDoc.populate("creator");

        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }
        
        if(req.user.username != req.assignmentDoc.creator.username){
            logger.warn("Unauthorized access assignment update attempt: " + req.user.username);
            logger.info("Assignment creator: " + req.assignmentDoc.creator.username);
            return res.status(403).send("You are not allowed to edit this assignment.");
        }

        logger.debug("req body: " + JSON.stringify(req.body));
        
        if(req.body.expectedZipName && req.body.expectedZipName.length > 0){
            req.assignmentDoc.expectedZipName = req.body.expectedZipName;
        }

        if(req.body.command && req.body.command.length > 0){
            req.assignmentDoc.command = req.body.command;
        }

        if(req.body.imageName && req.body.imageName.length > 0){
            req.assignmentDoc.imageName = req.body.imageName;
        }

        if(req.body.timeout && !isNaN(parseFloat(req.body.timeout))){
            req.assignmentDoc.timeout = parseFloat(req.body.timeout);
        }

        if(req.file && req.file.path){
            req.assignmentDoc.resources = req.file.path; // Update the resources path if a new file is uploaded
        }

        if(req.body.maxZipSize && !isNaN(parseFloat(req.body.maxZipSize))){
            req.assignmentDoc.maxSize = parseFloat(req.body.maxZipSize) * 1024 * 1024; // Convert max size from MB to bytes
        }

        if(req.body.maxGrade && !isNaN(parseFloat(req.body.maxGrade))){
            req.assignmentDoc.maxGrade = parseFloat(req.body.maxGrade);
        }

        if(req.body.extraSubmissionsPenaltyUnit && ["none", "percent", "points"].includes(req.body.extraSubmissionsPenaltyUnit)){
            req.assignmentDoc.extraSubmissionsPenaltyUnit = req.body.extraSubmissionsPenaltyUnit;
        }

        if(req.body.extraSubmissionsPenalty && !isNaN(parseFloat(req.body.extraSubmissionsPenalty))){
            req.assignmentDoc.extraSubmissionsPenalty = parseFloat(req.body.extraSubmissionsPenalty);
        }

        if(req.body.freeSubmissions && !isNaN(parseFloat(req.body.freeSubmissions))){
            req.assignmentDoc.freeSubmissions = parseFloat(req.body.freeSubmissions);
        }

        if(req.body.deadline && req.body.deadline.length > 0 && !isNaN(Date.parse(req.body.deadline))){
            req.assignmentDoc.deadline = new Date(req.body.deadline);
        }else{
            req.assignmentDoc.deadline = null; // Clear the deadline if no date is provided
        }

        await req.assignmentDoc.save();
        return res.redirect("/users/" + req.user.username + "/assignments/" + req.assignmentDoc.name);
    }catch (error) {
        logger.error("Error update assignment:", error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).send("Assignment already exists.");
        }
        if(error.name === 'ValidationError'){
            return res.status(400).send("Validation error: " + error.message);
        }
        return res.status(500).send("Error creating assignment. Try again.");
    }
});

router.post('/:assignment/delete', authCheck.checkRolePermission("admin"), async function(req, res){
    try{
        await req.assignmentDoc.populate("creator");

        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }
        
        if(req.user.username != req.assignmentDoc.creator.username){
            logger.warn("Unauthorized access assignment delete attempt: " + req.user.username);
            logger.warn("Assignment creator: " + req.assignmentDoc.creator.username);
            return res.status(403).send("You are not allowed to delete this assignment.");
        }

        if(!req.body.confirmDelete || req.body.confirmDelete !== "on"){
            return res.status(400).send("You must confirm the deletion of the assignment.");
        }

        logger.debug("Deleting assignment: " + req.assignmentDoc.name);
        
        //delete all uploads for this assignment
        let uploadsDir = path.join('uploads', req.assignmentDoc.name);
        if(fs.existsSync(uploadsDir)){
            await fsPromises.rm(uploadsDir, { recursive: true, force: true });
        }

        let executions = await executionModel.find({ assignment: req.assignmentDoc._id }).exec();

        for(let execution of executions){
            //delete uploads for this assignment (upload dir)
            if(execution.zipFilePath && fs.existsSync(execution.zipFilePath)){
                await fsPromises.rm(execution.zipFilePath, { force: true });
            }
            //delete feedback for each execution (feedback dir)
            if(execution.feedbackPath && fs.existsSync(execution.feedbackPath)){
                await fsPromises.rm(execution.feedbackPath, { force: true });
            }

            //delete logs for each execution
            let logsFile = path.join("logs", 'logs-' + execution._id + '.txt');
            if(fs.existsSync(logsFile)){
                await fsPromises.rm(logsFile, { force: true });
            }
        }
        
        //delete all archives for this assignment
        //there shouldn't be any unless there were errors with archiving
        //this will clean up those errors
        let archivesDirContents = await fsPromises.readdir('archives', { withFileTypes: true });
        for(let entry of archivesDirContents){
            const archivePattern = new RegExp(`^${req.assignmentDoc.name}-\\d{8}_\\d{6}$`);
            if(entry.isDirectory() && archivePattern.test(entry.name)) {
                await fsPromises.rm(path.join('archives', entry.name), { recursive: true, force: true });
            }
        }

        //delete resources for this assignmnet
        if(req.assignmentDoc.resources && fs.existsSync(req.assignmentDoc.resources)){
            await fsPromises.rm(req.assignmentDoc.resources, { force: true });
        }

        //delete all executions for this assignment
        await executionModel.deleteMany({ assignment: req.assignmentDoc._id });
        //delete assignment document
        await assignmentModel.deleteOne({ _id: req.assignmentDoc._id });

        return res.redirect("/users/" + req.user.username);
    }catch (error) {
        logger.error("Error deleting assignment:", error);
        return res.status(500).send("Error deleting assignment. Try again.");
    }
});

router.post('/:assignment/archive', authCheck.checkRolePermission("admin"), async function(req, res){
    try{
        await req.assignmentDoc.populate("creator");

        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }
        
        if(req.user.username != req.assignmentDoc.creator.username){
            logger.warn("Unauthorized access assignment update attempt: " + req.user.username);
            logger.warn("Assignment creator: " + req.assignmentDoc.creator.username);
            return res.status(403).send("You are not allowed to edit this assignment.");
        }


        const dateTimeString = getFormattedDateTimeForFolderName();
        const archiveDir = path.join('archives', req.assignmentDoc.name + '-' + dateTimeString);
        await fsPromises.mkdir(archiveDir, { recursive: true });

        const archiveSummaryPath = path.join(archiveDir, req.assignmentDoc.name + '-summary-' + dateTimeString + '.txt');
        const archiveSummaryFile = await fsPromises.open(archiveSummaryPath, 'w');
        const archiveSummaryStream = await archiveSummaryFile.createWriteStream({ encoding: 'utf8' });
        
        archiveSummaryStream.write("Assignment Name: " + req.assignmentDoc.name + "\n");
        archiveSummaryStream.write("Creator: " + (req.assignmentDoc.creator ? req.assignmentDoc.creator.username : "Unknown") + "\n");
        archiveSummaryStream.write("Max Grade: " + req.assignmentDoc.maxGrade + "\n");
        archiveSummaryStream.write("Archive Created At: " + new Date().toISOString() + "\n\n");        

        await fsPromises.copyFile(req.assignmentDoc.resources, path.join(archiveDir, path.basename(req.assignmentDoc.resources)));
        
        const executionSummaryPath = path.join(archiveDir, 'execution-summary.txt');
        const executionSummaryFile = await fsPromises.open(executionSummaryPath, 'w');
        const executionSummaryStream = executionSummaryFile.createWriteStream({ encoding: 'utf8' });

        const executions = await executionModel.find({ assignment: req.assignmentDoc._id }).sort({studentName: 1, createdAt: -1 }).exec();
        if(executions && executions.length > 0){
            const uploadsDir = path.join(archiveDir, 'uploads');
            const feedbackArchiveDir = path.join(archiveDir, 'feedback');
            const logsArchiveDir = path.join(archiveDir, 'logs');
            await fsPromises.mkdir(feedbackArchiveDir, { recursive: true });
            await fsPromises.mkdir(uploadsDir, { recursive: true });
            await fsPromises.mkdir(logsArchiveDir, { recursive: true });
            for(let execution of executions){
                executionSummaryStream.write(`Execution ID: ${execution._id}, Student: ${execution.studentName}, Created At: ${execution.createdAt}, Status: ${execution.status}, Grade: ${execution.grade}\n`);

                if(execution.zipFilePath && fs.existsSync(execution.zipFilePath)){
                    await fsPromises.copyFile(execution.zipFilePath, path.join(uploadsDir, execution.studentName + "-upload-" + execution._id + ".zip"));                    
                }
                if(execution.feedbackPath && fs.existsSync(execution.feedbackPath)){
                    await fsPromises.copyFile(execution.feedbackPath, path.join(feedbackArchiveDir, execution.studentName + "-feedback-" + execution._id + ".txt"));
                }

                let logsFile = path.join("logs", 'logs-' + execution._id + '.txt');
                if(fs.existsSync(logsFile)){
                    await fsPromises.copyFile(logsFile, path.join(logsArchiveDir, execution.studentName + '-logs-' + execution._id + '.txt'));
                }
            }
        }else{
            executionSummaryStream.write("No executions found for this assignment.\n");
            archiveSummaryStream.write("No executions found for this assignment.\n\n");
        }


        executionSummaryStream.end();
        await executionSummaryFile.close();
        archiveSummaryStream.end();
        await archiveSummaryFile.close();

        try{
            const zipData = new admZip();
            zipData.addLocalFolder(archiveDir, "");;
            // get everything as a buffer
            let zipBuffer = await zipData.toBuffer();
            if(!zipBuffer || zipBuffer.length === 0){
                return res.status(500).send("Error creating zip file. No data to write.");
            }
            // or write everything to disk
            res.status(200);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="' + req.assignmentDoc.name + '-archive-' + dateTimeString + '.zip"');
            res.setHeader('Content-Length', zipBuffer.length);
            res.write(zipBuffer);
            
            res.end();
            await fsPromises.rm(archiveDir, { recursive: true, force: true });
        }catch(error) {
            logger.error("Error creating zip file:", error);
            return res.status(500).send("Error creating zip file. Try again.");
        } 
        
    }catch (error) {
        logger.error("Error archiving assignment:", error);
        return res.status(500).send("Error archiving assignment. Try again.");
    }
});

router.post('/:assignment/grades', authCheck.checkRolePermission("admin"), assignmentUpload.single('resourcesZip'), async function(req, res){
    try{
        await req.assignmentDoc.populate("creator");

        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }
        logger.debug("req body: " + JSON.stringify(req.body));
        if(req.user.username != req.assignmentDoc.creator.username){
            logger.warn("Unauthorized access assignment grade attempt: " + req.user.username);
            logger.warn("Assignment creator: " + req.assignmentDoc.creator.username);
            return res.status(403).send("You are not allowed to manipulate this assignment.");
        }

        const validGradeModes = ["highest", "recent"];
        if(!req.body.grademode || !validGradeModes.includes(req.body.grademode)){
            return res.status(400).send("Invalid grade mode specified. Valid modes are: " + validGradeModes.join(", ") + ".");
        }

        const validData = ["csv", "feedback", "all"];
        if(!req.body.includeData || !validData.includes(req.body.includeData)){
            return res.status(400).send("Invalid data mode specified. Valid modes are: " + validData.join(", ") + ".");
        }


        let cutoffDate = new Date();
        if(req.body.cutoff && req.body.cutoff.length > 0){
            cutoffDate = new Date(req.body.cutoff);
        }
        
        let submissions = await executionModel.find({ assignment: req.assignmentDoc._id, createdAt: { $lte: cutoffDate }, status: "completed"})
            .select("studentName feedbackPath createdAt grade zipFilePath").sort({ createdAt: -1 }).exec();
        
        let penalties = {};
        if(req.assignmentDoc.extraSubmissionsPenaltyUnit !== "none" && req.assignmentDoc.freeSubmissions > 0){
            for(let submission of submissions){
                let numSubmissions = await executionModel.countDocuments({ assignment: req.assignmentDoc._id, studentName: submission.studentName, status: "completed" }).exec()
                if(numSubmissions > req.assignmentDoc.freeSubmissions){
                    let extraSubmissions = numSubmissions - req.assignmentDoc.freeSubmissions;
                    if(req.assignmentDoc.extraSubmissionsPenaltyUnit === "percent"){
                        penalties[submission.studentName] = (req.assignmentDoc.maxGrade * (req.assignmentDoc.extraSubmissionsPenalty / 100.0)) * extraSubmissions;
                    }else if(req.assignmentDoc.extraSubmissionsPenaltyUnit === "points"){
                        penalties[submission.studentName] = req.assignmentDoc.extraSubmissionsPenalty * extraSubmissions;
                    }
                }
            }
        }

        logger.debug("Penalties: " + JSON.stringify(penalties));
        
        let grades = {};
        for(let submission of submissions){
            logger.debug(submission.studentName + " - " + submission.feedbackPath + " - " + submission.createdAt + " - " + submission.grade);

            if(!grades[submission.studentName]){
                grades[submission.studentName] = {
                    feedbackPath: submission.feedbackPath,
                    createdAt: new Date(submission.createdAt),
                    grade: submission.grade,
                    zipFilePath: submission.zipFilePath
                };
            }else{
                if(req.body.grademode === "highest"){
                    if(submission.grade > grades[submission.studentName].grade){
                        grades[submission.studentName].grade = submission.grade;
                        grades[submission.studentName].feedbackPath = submission.feedbackPath;
                        grades[submission.studentName].createdAt = new Date(submission.createdAt);
                        grades[submission.studentName].zipFilePath = submission.zipFilePath;
                    }
                }else if(req.body.grademode === "recent"){
                    //do nothing, since we are going from newest to oldest
                    continue;
                }
            }
        }

        if(req.assignmentDoc.extraSubmissionsPenaltyUnit !== "none" && req.assignmentDoc.freeSubmissions > 0){
            for(let student in grades){
                if(penalties[student]){
                    let roundedGradeString = (grades[student].grade - penalties[student]).toFixed(2);
                    grades[student].grade = parseFloat(roundedGradeString);
                    if(grades[student].grade < 0){
                        grades[student].grade = 0; // Ensure grade does not go below 0
                    }
                }
            }
        }


        sendGradeData(req, res, grades);
    }catch (error) {
        logger.error("Error update assignment:", error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).send("Assignment already exists.");
        }
        if(error.name === 'ValidationError'){
            return res.status(400).send("Validation error: " + error.message);
        }
        return res.status(500).send("Error exporting grades. Try again.");
    }
});


async function sendGradeData(req, res, grades) {
    let includeData = req.body.includeData;
    let includeGrades = true;
    let includeFeedback = false;
    let includeSubmissions = false;
    if(includeData === "feedback" || includeData === "all"){
        includeFeedback = true;
    }
    if(includeData === "all"){
        includeSubmissions = true;
    }

    const dateTimeString = getFormattedDateTimeForFolderName();

    const gradeOutputDir = path.join('gradingoutput', req.assignmentDoc.name + "-grades-" + dateTimeString);
    await fsPromises.mkdir(gradeOutputDir, { recursive: true });
    
    const feedbackOutputDirName = "feedback";
    const feedbackOutputDir = path.join(gradeOutputDir, feedbackOutputDirName);
    if(includeFeedback){
        await fsPromises.mkdir(feedbackOutputDir, { recursive: true });
    }

    const submissionOutputDirName = "submissions";
    const submissionOutputDir = path.join(gradeOutputDir, submissionOutputDirName);
    if(includeSubmissions){    
        await fsPromises.mkdir(submissionOutputDir, { recursive: true });
    }

    const settingsFilePath = path.join(gradeOutputDir, req.assignmentDoc.name + "-settings-" + dateTimeString + ".txt");
    const  settingsFile = await fsPromises.open(settingsFilePath, "w");
    const settingsStream = await settingsFile.createWriteStream({ encoding: 'utf8' });
    settingsStream.write("Assignment Name: " + req.assignmentDoc.name + "\n");
    settingsStream.write("Creator: " + (req.assignmentDoc.creator ? req.assignmentDoc.creator.username : "Unknown") + "\n");
    settingsStream.write("Max Grade: " + req.assignmentDoc.maxGrade + "\n");
    settingsStream.write("Grading Cutoff: " + req.body.cutoff + "\n");
    settingsStream.write("Grading Mode: " + req.body.grademode + "\n");
    settingsStream.write("Extra Submissions Penalty: " + req.assignmentDoc.extraSubmissionsPenalty + "\n");
    if(req.assignmentDoc.extraSubmissionsPenaltyUnit !== "none"){
        settingsStream.write("Extra Submissions Penalty Unit: " + req.assignmentDoc.extraSubmissionsPenaltyUnit + "\n");
        settingsStream.write("Free Submissions: " + req.assignmentDoc.freeSubmissions + "\n");
    }
    settingsStream.write("Generated At: " + new Date() + "\n");
    settingsStream.write("Include CSV: " + includeGrades + "\n");
    settingsStream.write("Include Feedback: " + includeFeedback + "\n");
    settingsStream.write("Include Submissions: " + includeSubmissions + "\n\n");

    let pendingExecutions = await executionModel.find({ assignment: req.assignmentDoc._id, status: "pending" }).exec();

    if(pendingExecutions.length > 0){
        settingsStream.write(`WARNING: There are ${pendingExecutions.length} pending executions for this assignment. They will not be included in the grade report.\n\n`);
        settingsStream.write("You may want to verify that these executions should not be included in the report.\n\n");
        settingsStream.write("Pending Executions:\n");
        for(let execution of pendingExecutions){
            settingsStream.write(`- Execution ID: ${execution._id}, Student: ${execution.studentName}, Created At: ${execution.createdAt}\n`);
        }
    }

    await settingsStream.end();
    await settingsFile.close();

    const csvFilePath = path.join(gradeOutputDir, req.assignmentDoc.name + "-grades-" + dateTimeString + ".csv");
    const  csvFile = await fsPromises.open(csvFilePath, "w");
    const csvStream = await csvFile.createWriteStream({ encoding: 'utf8' });
    
    if(includeData === "csv"){
        await csvStream.write("Username,Grade,Submission Date\n"); 
    }else if(includeData === "feedback"){
        await csvStream.write("Username,Grade,Submission Date,Feedback Path\n"); 
    }else{
        await csvStream.write("Username,Grade,Submission Date,Feedback Path,Submission Path\n"); 
    }

    //update entries in csv to have new names, remove submission column if not being included
    for(let grade in grades){
        let feedbackPath = grades[grade].feedbackPath ? grades[grade].feedbackPath : "No feedback provided";
        let submissionPath = grades[grade].zipFilePath ? grades[grade].zipFilePath : "No submission path available.";

        let submissionFilePath = path.join(submissionOutputDirName, grade + ".zip");
        let feedbackFilePath = path.join(feedbackOutputDirName, grade + "-feedback.txt");

        if(includeData === "csv"){
            await csvStream.write(`${grade},${grades[grade].grade},${grades[grade].createdAt.toISOString()}\n`);
        }else if(includeData === "feedback"){
            await csvStream.write(`${grade},${grades[grade].grade},${grades[grade].createdAt.toISOString()},${feedbackFilePath}\n`);
        }else{
            await csvStream.write(`${grade},${grades[grade].grade},${grades[grade].createdAt.toISOString()},${feedbackFilePath},${submissionFilePath}\n`);
        }

        if(includeFeedback){
            if(feedbackPath && feedbackPath !== "No feedback provided"){
                try {
                    await fsPromises.copyFile(feedbackPath, path.join(gradeOutputDir, feedbackFilePath));
                } catch (error) {
                    console.error(`Error copying feedback file for ${grade}:`, error);
                }
            }
        }

        if(includeSubmissions){
            if(submissionPath && submissionPath !== "No submission path available."){
                try {
                    await fsPromises.copyFile(submissionPath, path.join(gradeOutputDir, submissionFilePath));
                } catch (error) {
                    console.error(`Error copying submission file for ${grade}:`, error);
                }
            }
        }
    }
    
    csvStream.end();
    await csvFile.close();

    try{
        const zipData = new admZip();
        zipData.addLocalFolder(gradeOutputDir, "");;
        // get everything as a buffer
        let zipBuffer = await zipData.toBuffer();
        if(!zipBuffer || zipBuffer.length === 0){
            return res.status(500).send("Error creating zip file. No data to write.");
        }
        // or write everything to disk
        res.status(200);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="' + req.assignmentDoc.name + '-grades-' + dateTimeString + '.zip"');
        res.setHeader('Content-Length', zipBuffer.length);
        res.write(zipBuffer);
        
        res.end();
        await fsPromises.rm(gradeOutputDir, { recursive: true, force: true });
    }catch(error) {
        logger.error("Error creating zip file:", error);
        return res.status(500).send("Error creating zip file. Try again.");
    }   
}

function getFormattedDateTimeForFolderName() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

router.get('/:assignment/resources', authCheck.checkRolePermission("admin"), assignmentUpload.single('resourcesZip'), async function(req, res){
    try{
        await req.assignmentDoc.populate("creator");
        
        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }
        
        if(req.user.username != req.assignmentDoc.creator.username){
            return res.status(403).send("You are not allowed to access this assignment.");
        }
        
        let zipPath = req.assignmentDoc.resources;
        res.attachment(zipPath); // Sets Content-Disposition and Content-Type
        res.status(200);
        res.setHeader('Content-Type', 'application/zip');
        var readStream = fs.createReadStream(zipPath);
        readStream.pipe(res);
        return;
    }catch (error) {
        logger.error("Error update assignment:", error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).send("Assignment already exists.");
        }
        if(error.name === 'ValidationError'){
            return res.status(400).send("Validation error: " + error.message);
        }
        return res.status(500).send("Error creating assignment. Try again.");
    }
});

// Route to handle GET request for :username/assignments/:assignment
router.get('/:assignment', authCheck.checkRolePermission("student"), async (req, res) => {
    try{
        await req.assignmentDoc.populate("creator");

        if(req.user.username == req.assignmentDoc.creator.username){
            let subs = await executionModel.find({ assignment: req.assignmentDoc._id }).select("finishedAt createdAt status _id studentName").sort({ createdAt: -1 }).limit(50).exec();
            logger.debug("Found " + subs.length + " submissions for assignment: " + req.assignmentDoc.name);
            
            let deadlineString = ""
            if(req.assignmentDoc.deadline && req.assignmentDoc.deadline instanceof Date && !isNaN(req.assignmentDoc.deadline.getTime())){
                let date = req.assignmentDoc.deadline;
                deadlineString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                logger.debug("Deadline string: " + deadlineString);
            }
            return res.render("assignmentowner", {user: req.user, assignment: req.assignmentDoc, subs: subs, deadline: deadlineString, toDeadline: dateFNS.formatDistanceToNow(req.assignmentDoc.deadline, { addSuffix: true, includeSeconds: true }), deadlinePassed: req.assignmentDoc.deadline && req.assignmentDoc.deadline instanceof Date && !isNaN(req.assignmentDoc.deadline.getTime()) && new Date() > req.assignmentDoc.deadline});
        }else{
            let numSubmissions = 0;
            if(req.assignmentDoc.extraSubmissionsPenaltyUnit !== "none" && req.assignmentDoc.freeSubmissions > 0){
                numSubmissions = await executionModel.countDocuments({ assignment: req.assignmentDoc._id, studentName: req.user.username, status: {$in: ["pending", "completed"]}}).exec();
            }
            return res.render("assignment", {user: req.user, assignment: req.assignmentDoc, numSubmissions: numSubmissions, toDeadline: dateFNS.formatDistanceToNow(req.assignmentDoc.deadline, { addSuffix: true, includeSeconds: true }), deadlinePassed: req.assignmentDoc.deadline && req.assignmentDoc.deadline instanceof Date && !isNaN(req.assignmentDoc.deadline.getTime()) && new Date() > req.assignmentDoc.deadline});
        }        
    } catch (error) {
        logger.error("Error fetching assignment:", error);
        logger.error(error.stack);
        return res.status(500).send("Error fetching assignment. Try again.");
    }
});

function handleMulterError(err, req, res, next){
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return res.status(413).send('File too large. Check the maximum file size allowed.');
    } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(500).send("Unexpected error, try again.");
    }
    next();
}

router.post('/:assignment', authCheck.checkRolePermission("student"), submissionUpload.single('zipFile'), handleMulterError, async (req, res) => {
    if(!req.user || !req.user.username){
        logger.warn("Unauthorized access assignment submission attempt: " + (req.user ? req.user.username : "unknown"));
        return res.status(403).send('Unauthorized access.');
    }

    let assignmentDoc = req.assignmentDoc;
    if (!assignmentDoc) {
        return res.status(404).send('Assignment not found.');
    }

    if( assignmentDoc.deadline && assignmentDoc.deadline instanceof Date && !isNaN(assignmentDoc.deadline.getTime())){
        let now = new Date();
        if(now > assignmentDoc.deadline){
            return res.status(403).send('The deadline for this assignment has passed. You cannot submit it anymore.');
        }
    }   
    
    if (!req.file) {
        return res.status(400).send('No submission zip uploaded.');
    }

    const zipFilePath = req.file.path;
        
    try{
        let executionEntry = new executionModel({
            assignment: assignmentDoc._id,
            studentName: req.user.username,
            zipFilePath: zipFilePath
        });

        await executionEntry.save();
        await executionEntry.populate("assignment");

        let success = await assignmentExecutor.addAssignment(executionEntry);
        if(!success){
            executionEntry.status = "failed";
            await executionModel.findByIdAndDelete(executionEntry._id);
            return res.status(503).send('The execution queue is currently full. Please try again later.');
        }
        
        return res.redirect("/executions/" + executionEntry._id);
        //return res.status(200).send('Assignment submitted successfully. You can view the report here <a href="/executions/' + executionEntry._id + '">here</a>.');
    } catch (error) {
        logger.error("Error processing assignment:", error);
        return res.status(500).send("Error processing assignment. Try again.");
    }
});

router.post("/", authCheck.checkRolePermission("admin"), assignmentUpload.single('resourcesZip'), async function(req, res){
    try{
        if(!req.user || !req.user._id){
            logger.error("Could not get creator user.");
            throw Error("Could not get creator user.");
        }

        if(!req.file || !req.file.path){
            logger.error("No resources file included.");
            throw Error("No resources file included.");
        }

        logger.debug("Received file for assignment upload:");
        logger.debug(JSON.stringify(req.body));

        let assignment = new assignmentModel(req.body);
        assignment.creator = req.user._id; // Set the creator to the user ID from the request
        assignment.resources = req.file.path; // Path to the uploaded resources zip file
        assignment.maxSize = parseInt(req.body.maxZipSize) * 1024 * 1024; // Convert max size from MB to bytes
        await assignment.save();
        return res.redirect("/users/" + req.user.username + "/assignments/" + assignment.name);
        //return res.status(202).send("Assignment uploaded successfully. You can view the submission page <a href='/users/" + req.user.username + "/assignments/" + assignment.name + "'>here</a>.");
    }catch (error) {
        logger.error("Error creating assignment:", error);
        //print stack trace of error
        logger.error(error.stack);
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).send("Assignment already exists.");
        }
        return res.status(500).send("Error creating assignment. Try again.");
    }
});



module.exports = router;