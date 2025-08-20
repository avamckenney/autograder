const Docker = require('dockerode');
const tar = require('tar');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const FEEDBACK_OUTPUT_DIR = "feedback/"; //TODO: move to config file?
const SAVE_LOGS = true;
const LOGS_OUTPUT_DIR = "logs/"; //TODO: move to config file?
const logger = require('./logger'); // Import the logger module


// Connect to the Docker daemon (default socket path)
const docker = new Docker();

async function createTarFile(executionEntry) {
  try {
    logger.debug(`Creating tar file for execution entry: ${executionEntry._id}`);
    let script = "";
    script += "unzip ../" + executionEntry.zipFilePath + " -d ./\n";
    script += "unzip -o ../" + executionEntry.assignment.resources + " -d ./\n";
    //script += "ls -l\n";
    script += "timeout -v " + executionEntry.assignment.timeout + " " + executionEntry.assignment.command + "\n"
    script += "mv feedback.txt " + "feedback-" + executionEntry._id + ".txt\n";
    script += "mv grade.txt " + "grade-" + executionEntry._id + ".txt\n";
    //script += "ls -l\n";
    await fsPromises.writeFile(path.join("scripts", executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh"), script);

    let zipPath = executionEntry.zipFilePath + ".data.tar.gz";
    await tar.create(
      {
        gzip: true,
        file: zipPath,
      },
      [executionEntry.assignment.resources, executionEntry.zipFilePath, path.join("scripts", executionEntry.zipFilePath.replaceAll(path.sep, '.') + ".script.sh")]
    );
    logger.debug(`Tar archive created successfully at: ${zipPath}`);
    return zipPath;
  } catch (error) {
    await saveErrorLogFile(executionEntry, error);
    logger.error('Error creating tar archive:', error);
    return "";
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
    await saveErrorLogFile(executionEntry, err);
    if (err.statusCode !== 404) { // Ignore not found error
      logger.error(`Error removing existing container: ${containerName}`, err);
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
           Memory: 5.12e+8, // 512MB in bytes
           //AutoRemove: true, // Automatically remove the container when it exits
           StorageOpt: {
             "size": "100M" // Set the size of the container's filesystem
            }
          }
        });
        
        let tarPath = await createTarFile(executionEntry);
        if(tarPath === ""){
            throw Error("Could not create tar file for execution entry " + executionEntry._id);
        }

        await container.putArchive(tarPath, {path: '/'});
        await container.start();
        
        
        let data = await container.wait();

        if(SAVE_LOGS){
          console.log("Saving logs for execution entry: " + executionEntry._id);
          const logs = await container.logs({stdout: true, stderr: true});
          console.log("Logs for execution entry: " + executionEntry._id);
          let logFilePath = path.join(LOGS_OUTPUT_DIR, 'logs-' + executionEntry._id + '.txt');
          await fsPromises.writeFile(logFilePath, logs.toString('utf8'));
        }   

        if(data.StatusCode !== 0){
          executionEntry.status = "failed";
          executionEntry.finishedAt = Date.now();
          executionEntry.executionTime = (executionEntry.finishedAt - executionEntry.createdAt) / 1000;
          executionEntry.feedback = "Execution failed. Contact the creator of the assignment for more information.";
          executionEntry.feedbackPath = "";
          await executionEntry.save();
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
  logger.error("Saving error log execution: " + executionEntry._id);
  let logFilePath = path.join(LOGS_OUTPUT_DIR, 'logs-' + executionEntry._id + '-error.txt');
  await fsPromises.writeFile(logFilePath, error.toString('utf8'));
}

fs.mkdirSync("scripts", { recursive: true })
fs.mkdirSync(FEEDBACK_OUTPUT_DIR, { recursive: true })
fs.mkdirSync(LOGS_OUTPUT_DIR, { recursive: true })

module.exports = {
    clearExistingContainer,
    createAndStartContainer,
    saveErrorLogFile,
};
