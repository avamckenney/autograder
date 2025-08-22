const express = require('express');
const assignmentRouter = require('./assignments');
const router = express.Router();
const EXECUTION_VIEW_LIMIT = 25;
const logger = require('../logger').logger; // Import the logger module

const mongoose = require('mongoose');
const executionModel = mongoose.model('Execution', require('../model/ExecutionModel'));
const userModel = mongoose.model('User', require('../model/UserModel'));
const assignmentModel = mongoose.model('Assignment', require('../model/AssignmentModel'));

/*const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cuautograder@gmail.com',
    pass: 'cpnm sajc lnkw dwio'
  }
});*/ 

router.param('username', async (req, res, next, username) => {
    try{
        logger.debug("Checking user access for username:", username);
        logger.debug("Current user:", req.user ? req.user.username : "not authenticated");

        let record = await userModel.findOne({username: username});
        if (!record) {
            logger.warn("User not found:", username);
            return res.status(404).send('User not found.');
        }

        next();
    } catch (error) {
        logger.error("Error fetching execution record:", error);
        return res.status(500).send("Error fetching execution record. Try again later.");
    }   
});

// Handle GET request with :username parameter
router.get('/:username', async function (req, res) {
    try{
        if(!req.user || req.user.username != req.params.username){
            logger.warn("Unauthorized access attempt to user (" + req.params.username + "): " + (req.user ? req.user.username : "unknown"));
            return res.status(403).send('Unauthorized access.');
        }

        let executions = await executionModel.find({ studentName: req.user.username }).limit(EXECUTION_VIEW_LIMIT).sort({ createdAt: -1 }).select("_id assignment status finishedAt createdAt").populate({path: 'assignment', populate: {path: "creator"}}).exec();

        if(req.user.role == "student") {
            res.render('studentuser', { displaycap: EXECUTION_VIEW_LIMIT, user: req.user, executions: executions });    
        }else if(req.user.role == "admin") {
            let assignments = await assignmentModel.find({creator: req.user._id}).sort({ createdAt: -1 }).exec();
            res.render('adminuser', { displaycap: EXECUTION_VIEW_LIMIT, user: req.user, executions: executions, assignments: assignments });    
        }else{
            logger.error("Unknown user role:", req.user.role);
            return res.status(403).send("Unauthorized access.");
        }
    } catch (error) {
        logger.error("Error fetching user data:", error);
        return res.status(500).send("Unexpected error. Try again later.");
    }   
});

// Handle GET request with :username parameter
router.get('/:username/password', async function (req, res) {
    try{
        if(!req.user || req.user.username != req.params.username){
            logger.warn("Unauthorized access attempt to user: " + (req.user ? req.user.username : "unknown"));
            return res.status(403).send('Unauthorized access.');
        }

        return res.render('changepassword', { user: req.user});        
    } catch (error) {
        logger.error("Error fetching user data:", error);
        return res.status(500).send("Unexpected error. Try again later.");
    }   
});

// Handle GET request with :username parameter
router.post('/:username/password', async function (req, res) {
    try{
        if(!req.user || req.user.username != req.params.username){
            logger.warn("Unauthorized access attempt to user: " + (req.user ? req.user.username : "unknown"));
            return res.status(403).send('Unauthorized access.');
        }

        if(!req.body || !req.body.currentPassword || !req.body.newPassword) {
            logger.warn("Invalid request body:", req.body);
            return res.status(400).send('Invalid request body. Please provide current and new password.');
        }

        if(req.body.currentPassword === req.body.newPassword) {
            logger.warn("Current password and new password are the same.");
            return res.status(400).send('Current password and new password cannot be the same.');
        }

        let user = await userModel.findOne({username: req.params.username});
        if (!user) {
            logger.warn("User not found:", req.params.username);
            return res.status(404).send('User not found.');
        }   

        user.changePassword(req.body.currentPassword, req.body.newPassword, function(err) {
            if (err) {
                // Handle errors like incorrect old password
                return res.status(400).send(err.message);
            }
            res.status(200).send('Password changed successfully, re-directing to login page.');
            req.logout(() => {
                logger.info("User logged out after password change.");
            });
        });
    } catch (error) {
        logger.error("Error fetching user data:", error);
        return res.status(500).send("Unexpected error. Try again later.");
    }   
});

// Handle GET request with :username and :assignment parameters
router.use('/:username/assignments', assignmentRouter);


module.exports = router;