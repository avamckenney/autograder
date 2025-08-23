const Docker = require('dockerode');
const tar = require('tar');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const FEEDBACK_OUTPUT_DIR = "feedback/"; //TODO: move to config file?
const SAVE_LOGS = true;
const LOGS_OUTPUT_DIR = "logs/"; //TODO: move to config file?
const logger = require('./logger').logger; // Import the logger module


// Connect to the Docker daemon (default socket path)
const docker = new Docker();

async function createIsolatedNetwork() {
  return await docker.createNetwork({
    Name: 'no-internet-network',
    Driver: 'bridge',
    Internal: true // key: prevents external access
  });
}

createIsolatedNetwork()
  .then(net => console.log('Created network', net.id))
  .catch(console.error);

async function createTarFile(executionEntry) {
  try {
    logger.info(`Creating tar file for execution entry: ${executionEntry._id}`);
    
    let script = "";
    script += "unzip ../" + executionEntry.zipFilePath + " -d ./\n";
    script += "unzip -o ../" + executionEntry.assignment.resources + " -d ./\n";
    //script += "ls -l\n";
    script += "timeout -v " + executionEntry.assignment.timeout + " " + executionEntry.assignment.command + "\n"
    script += "mv feedback.txt " + "feedback-" + executionEntry._id + ".txt\n";
    script += "mv grade.txt " + "grade-" + executionEntry._id + ".txt\n";
    //script += "ls -l\n";
    logger.info("Writing script to file for execution entry: " + executionEntry._id);
    await fsPromises.writeFile(path.join("scripts", executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh"), script);
    logger.info("Script written to file for execution entry: " + executionEntry._id);

    let zipPath = executionEntry.zipFilePath + ".data.tar.gz";
    logger.info(`Creating tar archive at: ${zipPath}`);
    await tar.create(
      {
        gzip: true,
        file: zipPath,
      },
      [executionEntry.assignment.resources, executionEntry.zipFilePath, path.join("scripts", executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh")]
    );
    logger.info(`Tar archive created successfully at: ${zipPath}`);
    return zipPath;
  } catch (error) {
    logger.error('Error during tar archive creation:', error);
    logger.error(error.stack);
    throw error;
  }
}

function createContainerName(executionEntry){
    return executionEntry.studentName + "-" + executionEntry._id;
}

async function clearExistingContainer(executionEntry){
  let containerName = createContainerName(executionEntry)
  logger.debug(`Clearing existing container for execution entry: ${executionEntry._id}`);
  try {
    logger.debug(`Removing existing container: ${containerName}`);
    const existingContainer = await docker.getContainer(containerName);
    await existingContainer.remove({force: true});
    logger.debug(`Removed existing container: ${containerName}`);
  } catch (err) {
    console.error("Status code: " + err.statusCode);
    if (err.statusCode !== 404) { // Ignore not found error
      logger.error(`Error removing existing container: ${containerName}`, err);
      await saveErrorLogFile(executionEntry, err);
    } else {
      logger.debug(`No existing container named ${containerName} found.`);
    }
  }
}

async function createAndStartContainer(executionEntry) {
    let result = null;
    let container = null;
    try {
        // Create a container
        container = await docker.createContainer({
          Image: executionEntry.assignment.imageName, 
          Cmd: ['/bin/bash', '-c', "mkdir assignment && cp ./scripts/" + executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh ./assignment/ && cd assignment && chmod +x ./" + executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh " + " && ./" + executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh"], // Command to execute inside the container
          name: createContainerName(executionEntry),
          HostConfig: {
            NetworkMode: 'no-internet-network',
            Memory: 1.28e+8, // 128MB in bytes
            StorageOpt: {
             "size": "100M" // Set the size of the container's filesystem
            }
          }
        });
        
        let tarPath = await createTarFile(executionEntry);
        logger.debug("Tar file created for execution entry: " + executionEntry._id);
        logger.debug(`Tar path: ${tarPath}`);
        logger.info("Tar file created for execution entry: " + executionEntry._id);
        logger.info(`Tar path: ${tarPath}`);
        if(tarPath === ""){
            throw Error("Could not create tar file for execution entry " + executionEntry._id);
        }

        await container.putArchive(tarPath, {path: '/'});
        await container.start();
        
        
        let data = await container.wait();

        let logs = null;
        if(SAVE_LOGS){
          console.log("Saving logs for execution entry: " + executionEntry._id);
          logs = await container.logs({stdout: true, stderr: true});
          console.log("Logs for execution entry: " + executionEntry._id);
          let logFilePath = path.join(LOGS_OUTPUT_DIR, 'logs-' + executionEntry._id + '.txt');
          await fsPromises.writeFile(logFilePath, logs.toString('utf8'));
        }   

        if(data.StatusCode !== 0){
          logger.debug("Container execution failed: " + executionEntry._id);
          executionEntry.status = "failed";
          executionEntry.finishedAt = Date.now();
          executionEntry.executionTime = (executionEntry.finishedAt - executionEntry.createdAt) / 1000;
          executionEntry.feedback = "Execution failed. Contact the creator of the assignment for more information.";
          executionEntry.feedbackPath = "";

          if(!logs){
            logger.debug("Reading logs for execution entry: " + executionEntry._id);
            logs = await container.logs({stdout: true, stderr: true});
          }else{
            logger.debug("Logs already read for execution entry: " + executionEntry._id);
          }

          logs = logs.toString('utf8');

          if(logs){
            if(logs.includes("disk: No space left on device")){
              logger.debug("Container execution failed due to insufficient disk space: " + executionEntry._id);
              executionEntry.feedback = "Execution failed due to insufficient disk space. Your solution likely consumed too much disk space.";
            }else if(logs.includes("timeout: timeout: sending signal TERM to command")){
              logger.debug("Container execution failed due to timeout: " + executionEntry._id);
              executionEntry.feedback = "Execution failed due to timeout. Your solution took too long to execute.";
            }else{
              logger.debug("Did not find disk usage or timeout errors in logs.");
            }
          }else{
            logger.debug("No logs found for execution entry: " + executionEntry._id);
          }

          logger.debug("Saving execution entry: " + executionEntry._id);
          await executionEntry.save();
          logger.debug("Execution entry saved: " + executionEntry._id);
          return;
        }
        
        let result = await container.getArchive({path: "./assignment/feedback-" + executionEntry._id + ".txt"});
        let feedbackPath = path.join(FEEDBACK_OUTPUT_DIR, 'output-' + executionEntry.assignment.name + "-" +  executionEntry.studentName + "-" + executionEntry._id + '.tar')
        let outputStream = await fs.createWriteStream(feedbackPath);
        result.pipe(outputStream);    
        await new Promise((resolve, reject) => {
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
            result.on('error', reject); // Also handle stream errors
          });
        await tar.extract({ file: feedbackPath, cwd: FEEDBACK_OUTPUT_DIR });
        result = await container.getArchive({path: "./assignment/grade-" + executionEntry._id + ".txt"});
        let gradePath = path.join(FEEDBACK_OUTPUT_DIR, 'grade-output-' + executionEntry.assignment.name + "-" +  executionEntry.studentName + "-" + executionEntry._id + '.tar')
        outputStream = await fs.createWriteStream(gradePath);
        
        result.pipe(outputStream);    
        await new Promise((resolve, reject) => {
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
            result.on('error', reject); // Also handle stream errors
          });
        await tar.extract({ file: gradePath, cwd: FEEDBACK_OUTPUT_DIR });

        
        executionEntry.feedbackPath = path.join(FEEDBACK_OUTPUT_DIR, 'feedback-' + executionEntry._id + '.txt');
        executionEntry.feedback = await fsPromises.readFile(executionEntry.feedbackPath, 'utf8');        


        let gradeContent = await fsPromises.readFile(path.join(FEEDBACK_OUTPUT_DIR, 'grade-' + executionEntry._id + '.txt'), 'utf8');
        if (isNaN(parseFloat(gradeContent.trim()))) {
          executionEntry.status = "failed";    
          executionEntry.feedback = "Grade file does not contain a valid number.";
        }else{
          executionEntry.grade = parseFloat(gradeContent.trim());
          executionEntry.status = "completed";
        }
        
        executionEntry.finishedAt = Date.now();
        executionEntry.executionTime = (executionEntry.finishedAt - executionEntry.createdAt) / 1000;
        
        await fsPromises.unlink(path.join("scripts", executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh"));
        await fsPromises.unlink(tarPath);
        await fsPromises.unlink(path.join(FEEDBACK_OUTPUT_DIR, 'grade-' + executionEntry._id + '.txt'));
        await fsPromises.unlink(gradePath);
        await fsPromises.unlink(feedbackPath);

        await executionEntry.save();
        //console.log('Container created, started, and removed successfully!');
    } catch (err) {
        executionEntry.status = "failed";
        executionEntry.finishedAt = Date.now();
        executionEntry.executionTime = (executionEntry.finishedAt - executionEntry.createdAt) / 1000;
        executionEntry.feedback = "Execution failed. Contact the creator of the assignment for more information.";
        executionEntry.feedbackPath = "";
        await executionEntry.save();
        console.error('Error:', err);
        await saveErrorLogFile(executionEntry, err);
    }finally{
        // Remove the container
        try {          
          await container.remove();
        } catch (err) {
          if (err.statusCode !== 404) { // Ignore not found error
            console.error('Error removing existing container after running:', err);
          }
        }
    }
    return result;
}

async function saveErrorLogFile(executionEntry, error){
  try{
    let errorString = error.toString('utf8') + "\n\nStack Trace:\n" + error.stack;
    if (error.message) {
      errorString += "Error occurred during execution: " + error.message + "\n\n" + errorString;
    }

    logger.error("Saving error log execution: " + executionEntry._id);
    let logFilePath = path.join(LOGS_OUTPUT_DIR, 'logs-' + executionEntry._id + '-error.txt');
    await fsPromises.writeFile(logFilePath, errorString);
  }catch (err) {
    logger.error("Error saving error log file for execution entry " + executionEntry._id + ": " + err.message);
  }
}

fs.mkdirSync("scripts", { recursive: true })
fs.mkdirSync(FEEDBACK_OUTPUT_DIR, { recursive: true })
fs.mkdirSync(LOGS_OUTPUT_DIR, { recursive: true })

module.exports = {
    clearExistingContainer,
    createAndStartContainer,
    saveErrorLogFile,
};
