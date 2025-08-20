

const assignmentDir = "assignment-examples";
const assignmentNames = ["1405-helloworld-example", "1405Z-T2", "java-helloworld-example", "1405Z-T4"];
const assignmentExecutor = require("./assignmentexecutor");
const fsPromises = require('fs').promises;
const path = require('path');
const assignmentData = {};
const requestsPerSecond = 3;
const maxRequests = 150000;
const logAssignmentNumberInterval = 1500;
let submittedRequests = 0;
const loadTestZipDir = "loadtest-zips";
const fs = require('fs');

const mongoose = require('mongoose');
const assignmentModel = mongoose.model('Assignment', require('./model/AssignmentModel'));
const executionModel = mongoose.model('Execution', require('./model/ExecutionModel'));


async function loadAssignmentData() {
    for(const assignmentName of assignmentNames) {
        assignmentData[assignmentName] = [];
        try {
            const solutionsPath = path.join(assignmentDir, assignmentName, "example-solutions");
            let files = await fsPromises.readdir(solutionsPath);
            files = files.filter(file => file.endsWith('.zip')); // Filter only zip files
            for(const file of files) {
                const filePath = path.join(solutionsPath, file);
                assignmentData[assignmentName].push(filePath);
            }
        }catch (error) {
            console.error(`Error loading assignment data for ${assignmentName}:`, error);
            continue;
        }
    }
    console.log("Assignment data loaded successfully.");
    console.log(assignmentData);
}

async function waitForQueueDrain(){
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            let result = await executionModel.findOne({ status: "pending"});
            if (!result) {
                clearInterval(interval);
                resolve();
                analyseResults()
            }
        }, 250);
    });
}

async function simSecond() {
    for(let i = 0; i < requestsPerSecond; i++){
        submittedRequests++;
        if(submittedRequests % logAssignmentNumberInterval === 0){
            console.log(`Submitted ${submittedRequests} requests so far.`);
            
            fs.writeFile("loadtest-progress.txt", `Submitted ${submittedRequests} requests so far.\nMax Queue Count Reached: ${assignmentExecutor.getMaxQueueCountReached()}\nCurren Queue Side: ${assignmentExecutor.getQueueCount()}\n`, (err) => {
                if (err) {
                    console.error("Error writing progress file:", err);
                } else {
                    console.log("Progress file updated.");
                }
            });
        }
        if(submittedRequests > maxRequests){
            console.log("Max requests reached, stopping submission.");
            await waitForQueueDrain();
            console.log("All assignments processed, exiting.");
            return;
        }

        try{
            const assignment = assignmentNames[Math.floor(Math.random() * assignmentNames.length)];
            
            let assignmentDoc = await assignmentModel.findByName(assignment);
            if (!assignmentDoc) {
                throw Error('Assignment not found.');
            }
            
            let executionEntry = new executionModel({
                assignment: assignmentDoc._id,
                studentName: "teststudent-" + submittedRequests, //TODO: add student reference
            });
            const origZipFilePath = assignmentData[assignment][Math.floor(Math.random() * assignmentData[assignment].length)];
            await fsPromises.copyFile(origZipFilePath, path.join(loadTestZipDir, executionEntry._id + ".zip"));
            const zipFilePath = path.join(loadTestZipDir, executionEntry._id + ".zip");
            executionEntry.zipFilePath = zipFilePath;
            await executionEntry.save();
            await executionEntry.populate("assignment");

            assignmentExecutor.addAssignment(executionEntry);
            
        } catch (error) {
            console.error("Error processing assignment:", error);
            console.error(error.stack);
        }
    }
    setTimeout(simSecond, 1000);
}

async function analyseResults(){
    console.log("Analysing Results...");


    let percentiles = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.50, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
    let count = await executionModel.countDocuments();
    let aggregate = await executionModel.aggregate([ 
        {
        $group: {
            _id: null,
            average: {
                $avg: "$executionTime"
            },
            median: {
                $median: {
                    input: "$executionTime",
                    method: "approximate"
                }
            },
            percentiles: {
                $percentile: {
                    input: "$executionTime",
                    p: percentiles,
                    method: "approximate"
                }
            }
        }
    }])
    console.log(aggregate);
    console.log("Total Submissions Processed:: " + count);
    console.log("Average Execution Time: " + aggregate[0].average);
    console.log("Median Execution Time: " + aggregate[0].median);
    console.log("Percentile Times:");
    for(let i = 0; i < percentiles.length; i++){
        console.log(percentiles[i] + ": " + aggregate[0].percentiles[i]);
    }
    
    console.log("Max Queue Count Reached: " + assignmentExecutor.getMaxQueueCountReached());
    console.log("Load Test Completed Successfully.");
    console.log("Exiting process.");
    await mongoose.disconnect();
    process.exit(1);
}

async function runTest(){
    await mongoose.connect('mongodb://127.0.0.1:27017/autograderwebapp');
    await fsPromises.rmdir(loadTestZipDir, { recursive: true, force: true }).catch(() => {});
    await fsPromises.mkdir(loadTestZipDir, { recursive: true });
    await executionModel.deleteMany({});
    await loadAssignmentData();
    await assignmentExecutor.startAssignmentProcessing();
    simSecond();
}

runTest().catch((err) => {
    console.error("Error running load test:", err.message);
    process.exit(1);
});