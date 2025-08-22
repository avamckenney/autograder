const express = require('express');
const router = express.Router({ mergeParams: true });
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const mongoose = require('mongoose');
const logger = require('../logger').logger;
const executionModel = mongoose.model('Execution', require('../model/ExecutionModel'));

router.param('execId', async (req, res, next, execId) => {
    try{
        let record = await executionModel.findById(execId).populate({path: 'assignment', populate: {path: "creator"}}).exec();;
        if (!record) {
            return res.status(404).send('Execution record not found.');
        }
        req.executionDoc = record;
        //console.log("Record:")
        //console.log(JSON.stringify(record));
        logger.debug("Execution record fetched for ID: " + execId);
        if(!req.user || ((req.user.username != req.executionDoc.studentName) && (req.user.username != req.executionDoc.assignment.creator.username))){
            logger.warn("Unauthorized access attempt to execution record by user: " + (req.user ? req.user.username : "unknown"));
            return res.status(403).send('Unauthorized access to execution record.');
        }
        next();
    } catch (error) {
        logger.error("Error fetching execution record:", error);
        return res.status(500).send("Error fetching execution record. Try again later.");
    }   
});

// Handle GET request for '/:subID'
router.get('/:execId', async (req, res) => {
    try{
        let record = req.executionDoc;

        let logs = null;
        if(req.user.username == req.executionDoc.assignment.creator.username) {
            if(record.status === 'completed' || record.status === 'failed') {
                let logFilePath = path.join("logs", 'logs-' + record._id + '.txt');
                let errorLogFilePath = path.join("logs", 'logs-' + record._id + '-error.txt');
                if (fs.existsSync(errorLogFilePath)) {
                    logs = "";
                    logs += "--- Error Log ---\n\n";
                    logs += await fsPromises.readFile(errorLogFilePath, 'utf8');
                    logs += "\n\n--- Error Log ---\n\n";
                }
                if (fs.existsSync(logFilePath)) {
                    if (!logs) {
                        logs = "";
                    }
                    logs += await fsPromises.readFile(logFilePath, 'utf8');
                }
            }
        }

        return res.render('executionrecord', { user: req.user, execution: record, date: new Date().toString(), logs: logs });
    }catch(err) {
        logger.error("Error fetching execution record:", err.message);
        return res.status(500).send("Error fetching execution record. Try again later.");
    }
});

router.get('/:execId/zip', async (req, res) => {
       try{
        let zipPath = req.executionDoc.zipFilePath;
        res.attachment(req.executionDoc._id + "-submission.zip"); // Sets Content-Disposition and Content-Type
        res.status(200);
        res.setHeader('Content-Type', 'application/zip');
        var readStream = fs.createReadStream(zipPath);
        readStream.pipe(res);
        return;
    }catch(err) {
        logger.error("Error fetching execution record:", err.message);
        return res.status(500).send("Error fetching execution record. Try again later.");
    }
});

router.get('/:execId/summary', async (req, res) => {
       try{
        let summaryText = `Summary for Execution ID: ${req.executionDoc._id}\n`;
        summaryText += `Student Name: ${req.executionDoc.studentName}\n`;
        summaryText += `Assignment: ${req.executionDoc.assignment.name}\n`;
        summaryText += `Submitted At: ${req.executionDoc.createdAt}\n`;
        summaryText += `Status: ${req.executionDoc.status}\n`;        
        summaryText += `Finished At: ${req.executionDoc.finishedAt || 'N/A'}\n`;
        summaryText += `Time to Grade: ${req.executionDoc.executionTime >= 0 ? req.executionDoc.executionTime : 'N/A'}\n\n`;
        summaryText += `Grade: ${req.executionDoc.grade >= 0 ? req.executionDoc.grade + "/" + req.executionDoc.assignment.maxGrade : "N/A"}\n\n`;
        summaryText += `Feedback: ${req.executionDoc.feedback ? "\n\n" + req.executionDoc.feedback : 'N/A'}`;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=execution-summary-${req.executionDoc.studentName}-${req.executionDoc._id}.txt`);
        res.status(200).send(summaryText);
        return;
    }catch(err) {
        logger.error("Error fetching execution record:", err.message);
        return res.status(500).send("Error fetching execution record. Try again later.");
    }
});
 
router.get('/:execId/feedback', async (req, res) => {
    try{
        //console.log("Fetching execution record for ID: " + execId);
        let record = req.executionDoc;
        
        if(record.status === 'completed' || record.status === 'failed') {
            let result = {
                status: record.status,
                feedback: record.feedback,
                finishedAt: record.finishedAt,
                executionTime: record.executionTime,
                gradeText: record.grade >= 0 ? record.grade + "/" + record.assignment.maxGrade : "N/A",
            };
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify(result));
        }else{
           return res.status(204).send(); // No content, execution still pending
        }
    }catch(err) {
        logger.error("Error fetching execution record:", err.message);
        return res.status(500).send("Internal Server Error");
    }
});


module.exports = router;