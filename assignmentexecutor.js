const { setTimeout } = require('node:timers/promises');
const fs = require('fs').promises;
const MAX_CONCURRENCY = 25; // Maximum number of concurrent executions
const MAX_WAIT_TIME = 1000; // Maximum wait time for processor to wait before checking for new assignments
const MAX_QUEUE_SIZE = 150000;
const logNoAssignmentInterval = 100;
let noAssignmentCount = 0;
let maxQueueCountReached = 0;
const recentExecutionTimes = []
var recentExecutionTimesTotal = 0;
const MAX_RECENT_EXECUTION_TIMES = 100; // Maximum number of recent execution times to keep
const assignmentQueue = [];
const assignmentMap = new Map();
const logger = require('./logger'); // Assuming logger.js is in the same directory
const FEEDBACK_OUTPUT_DIR = "feedback/"; //TODO: move to config file?
const dockerTool = require('./docker-tool');
let runCount = 0;

function generateKey(executionEntry) {
    return executionEntry.assignment.name + executionEntry.studentName;
}

async function addAssignment(executionEntry){
    const key = generateKey(executionEntry);
    logger.debug(`Adding assignment for key: ${key}`);
    
    if(!assignmentMap.has(key)){
        logger.debug(`New assignment for key: ${key}`);
        if(isRoomInQueue()){
            logger.debug(`Adding assignment to queue for key: ${key}`);
            assignmentQueue.push(key);
            assignmentMap.set(key, executionEntry);
            if(assignmentQueue.length > maxQueueCountReached){
                maxQueueCountReached = assignmentQueue.length;
            }
        }else{
            logger.warn(`Queue is full, cannot add assignment for key: ${key}`);
            return false;
        }
    }else{
        logger.debug(`Updating existing assignment for key: ${key}`);
        let previousEntry = assignmentMap.get(key);
        assignmentMap.set(key, executionEntry);
        previousEntry.status = "cancelled";
        previousEntry.finishedAt = new Date();
        await previousEntry.save();
    }
    
    return true;
}

function isRoomInQueue(){
    return assignmentQueue.length < MAX_QUEUE_SIZE;
}

function isQueueEmpty(){
    return assignmentQueue.length === 0;
}

async function startAssignmentProcessing(){
    logger.info("Starting assignment processing...");
    if(runCount > 0){
        logger.warn("Assignment processing already started, skipping...");
        return;
    }
    runCount++;
    await fs.mkdir(FEEDBACK_OUTPUT_DIR, { recursive: true })

    for(let i = 0; i < MAX_CONCURRENCY; i++) {
        executeAssignments(i);
    }
}

async function executeAssignments(threadNumber) {
    logger.info(`Assignment processing thread ${threadNumber} started.`);
    while(true){
        if(assignmentQueue.length === 0) {
            noAssignmentCount++;
            if(noAssignmentCount > logNoAssignmentInterval){
                logger.debug("No assignments to process, waiting for new assignments...");
                noAssignmentCount = 0; // Reset no assignment count
            }
            await setTimeout(Math.random()*MAX_WAIT_TIME);
            //await setTimeout(5000);
        }else{
            logger.info(`Thread ${threadNumber} processing assignment queue...`);
            noAssignmentCount = 0; // Reset no assignment count
            let key = assignmentQueue.shift();
            let entry = assignmentMap.get(key);
            assignmentMap.delete(key);
            let assignment = entry.assignment;
            try {
                logger.info(`Thread ${threadNumber} Processing assignment ${assignment.name} from date ${entry.createdAt}`);
                //logger.info(`Thread ${threadNumber} Assignment path: ${assignment.resources}`);
                //logger.info(`Thread ${threadNumber} Submission path: ${entry.zipFilePath}`);
                //logger.info(`Thread ${threadNumber} Command: ${assignment.command}`);
                await dockerTool.clearExistingContainer(entry);
                logger.info(`Thread ${threadNumber} Finished clearing existing container for assignment ${assignment.name}`);
                await dockerTool.createAndStartContainer(entry);
                logger.info(`Thread ${threadNumber} Finished processing assignment ${assignment.name}`);

                if(entry.status == "completed"){
                    // Update recent execution times
                    recentExecutionTimes.push(entry.executionTime);
                    recentExecutionTimesTotal += entry.executionTime;
                    if(recentExecutionTimes.length > MAX_RECENT_EXECUTION_TIMES){
                        let removedTime = recentExecutionTimes.shift();
                        recentExecutionTimesTotal -= removedTime;
                    }
                    let averageRecentTime = recentExecutionTimesTotal / recentExecutionTimes.length;
                    logger.info(`Average execution time over last ${recentExecutionTimes.length} executions: ${averageRecentTime.toFixed(2)} seconds`);
                }
                
                //await setTimeout(5000); // Simulate assignment processing
                //console.log(`Assignment ${assignment.name} executed completed.`);
            } catch (error) {
                logger.error(`Error executing assignment ${assignment.name}:`, error.message);
                await dockerTool.saveErrorLogFile(entry, error);
                entry.status = "failed";
                entry.finishedAt = new Date();
                entry.errorMessage = error.message;
                await entry.save();
            }
        }
    }
}

function getRecentAverageExecutionTime() {
    if(recentExecutionTimes.length === 0) return 0;
    return recentExecutionTimesTotal / recentExecutionTimes.length;
}

function getMaxQueueCountReached() {
    return maxQueueCountReached;
}

function getQueueCount() {
    return assignmentQueue.length;
}

//startAssignmentProcessing();



module.exports= { getRecentAverageExecutionTime, addAssignment, isRoomInQueue, isQueueEmpty, startAssignmentProcessing, getMaxQueueCountReached, getQueueCount};