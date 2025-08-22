//var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
const authCheck = require("./middleware/checkauth");
const logger = require('./logger'); // Import the logger module
const pinoHTTP = require('pino-http');
const assignmentExecutor = require('./assignmentexecutor'); // Import the assignment executor module
const config = require("./config.json");

const mongoose = require('mongoose');
const userModel = mongoose.model('User', require('./model/UserModel'));
const assignmentModel = mongoose.model('Assignment', require('./model/AssignmentModel'));
const executionModel = mongoose.model('Execution', require('./model/ExecutionModel'));

var indexRouter = require('./routes/index');

var app = express();

//proxy stuff

//logger
app.use(
  pinoHTTP({
    logger,
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('view cache', false);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


var passport = require('passport');
var LocalStrategy = require('passport-local');
var session = require('express-session');
var mongoDBSessionStore = require('connect-mongodb-session')(session);
var sessionStore = new mongoDBSessionStore({
  uri: `mongodb://${config.mongoAuth.user}:${config.mongoAuth.password}@${config.mongoAddress}/${config.sessionsDatabase}`,
  collection: 'sessions'
});

passport.use(new LocalStrategy(userModel.authenticate()));
app.use(session({
    secret: 'ladeedah', //TODO: update this to a more secure secret
    resave: true,
    store: sessionStore,
    saveUninitialized: false,
    cookie: { 
      path: '/', 
      httpOnly: true, 
      secure: false, 
      maxAge: 60 * 60 * 1000, // 5 minutes
      sameSite: true // 'strict' or 'lax' based on your requirements
    },
    rolling: true, // Reset the cookie expiration on every request
   })
);
//figure out cookie details
app.use(passport.authenticate('session'));  


app.get("/login.html", (req, res) => {
  res.render("login");
}); 

app.get("/login", (req, res) => {
  res.render("login");
});

app.post('/login', passport.authenticate('local', {failureRedirect: '/login.html'}), function(req, res) {
  // Successful authentication, redirect home.
  logger.info("User logged in successfully:", req.user);
  if(req.user){
    return res.redirect('/users/' + req.user.username); // Redirect to home page after successful login
  }
  logger.error("User login failed, redirecting to login page");
  return res.redirect("/login.html");
});
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 250, // Limit each user to 100 requests per windowMs
  keyGenerator: (req) => {
    // Assuming you have a user ID in the request (e.g., req.user.id)
    // Replace this with your actual user identification logic
    return req.user ? req.user.id : req.ip;
  },
  message: 'Too many requests from this user, please try again later.',
});
app.use(limiter);




app.use("/", function(req, res, next) {
  if(!req.isAuthenticated() && req.path !== "/login.html" && req.path !== "/login") {
    //console.log("User is not authenticated, redirecting to login");
    logger.warn("User is not authenticated, redirecting to login");
    return res.redirect("/login.html");
  }
  next();
});

app.use("/", function(req, res, next) {
  logger.info("Request received at: " + new Date().toISOString());
  logger.info("Request method: " + req.method);
  logger.info("Request path: " + req.path);
  logger.info("Request user: " + (req.user ? req.user.username : "Not authenticated"));
  logger.debug("DEBUG!");
  next()
});


assignmentExecutor.startAssignmentProcessing().then(() => {
  logger.info("Assignment processing started successfully.");
}).catch((err) => {
  logger.error("Error starting assignment processing:", err.message);
  logger.error(err.stack);
  process.exit(1); // Exit the process if assignment processing fails to start
});

app.use(express.static(path.join(__dirname, 'public')));


app.get('/logout', (req, res) => {
  req.logout(() => {
    logger.info("User logged out successfully:", req.user ? req.user.username : "Unknown user");
    res.redirect('/login.html'); // Redirect to login page after logout
  });
});


app.use("/", async function(req, res, next) {
  try{
    
    //req.user = await userModel.findOne({username: "testuser"}); // This is just a placeholder, you can set req.user based on your authentication logic  
    if(req.isAuthenticated()) {
      logger.info("User is authenticated: " + req.user.username);
      req.user = await userModel.findByUsername(req.user.username);
      if(!req.user) {
        logger.warn("Authenticated user not found in database: " + req.user.username);
        return res.status(404).send("User not found");
      }
      logger.info("Authenticated user: " + req.user);
    } else {
      logger.warn("User is not authenticated");
      return res.redirect("/login.html");
    }
  }catch(err) {
    logger.error("Error fetching user:", err.message);
    req.user = null;
    return res.status(500).send("Internal Server Error");
  }
  
  next();
});



async function registerTestUsers() {
    let testUsers = [
      { username: "teststudent", role: "student", batch: "testbatch" },
      { username: "teststudent2", role: "student", batch: "testbatch" },
      { username: "teststudent3", role: "student", batch: "testbatch" },
      { username: "testadmin", role: "admin", batch: "testbatch" },
      { username: "testadmin2", role: "admin", batch: "testbatch" },
      { username: "testadmin3", role: "admin", batch: "testbatch" }
    ];

    for (let user of testUsers) {
      try {
        await userModel.register(new userModel(user), "pass");
        console.log(`Test user registered successfully: ${user.username}`);
      } catch (err) {
        console.error("Error registering test user " + user.username + ": " + err.message);
      }
    }
}
registerTestUsers();




app.use('/', indexRouter);
app.use("/users", require("./routes/users"));
app.use("/executions", require("./routes/executions"));

/*
app.use("/", async function(req, res, next) {
  if(req.session.passport){
    if(req.session.passport.user && !req.session.user){
      
      let user = await userModel.findByUsername(req.session.passport.user);
      if(user != null){
        console.log("user:");
        console.log(user);
        console.log(user.role);
        req.session.user = user;
      }
    }
  }
  console.log("session data:");
  console.log(req.session);
  next();
});
*/

app.use("/create-assignment", authCheck.checkRolePermission("admin"), function(req, res) {
  res.render("addassignment", { user: req.user });
});

app.get("/statistics", authCheck.checkRolePermission("admin"), async function(req, res) {
  let usersCount = await userModel.countDocuments({});
  let assignmentsCount = await assignmentModel.countDocuments({});
  let executionsCount = await executionModel.countDocuments({});

  let assignments = await assignmentModel.find({}).populate('creator').exec();

  for(let assignment of assignments) {
    assignment.executionCount = await executionModel.countDocuments({ assignment: assignment._id });
    assignment.completedCount = await executionModel.countDocuments({ assignment: assignment._id, status: 'completed' });
    assignment.failedCount = await executionModel.countDocuments({ assignment: assignment._id, status: 'failed' });
    assignment.pendingCount = await executionModel.countDocuments({ assignment: assignment._id, status: 'pending' });
    let averageExecutionTime = await executionModel.aggregate([
      { $match: { assignment: assignment._id, status: 'completed' } },
      { $group: { _id: null, averageTime: { $avg: "$executionTime" } } }
    ]);
    assignment.averageExecutionTime = averageExecutionTime.length > 0 ? averageExecutionTime[0].averageTime : "N/A";
  }

  let queueSize = assignmentExecutor.getQueueCount();
  let maxQueueCountReached = assignmentExecutor.getMaxQueueCountReached();
  let recentAverageExecutionTime = assignmentExecutor.getRecentAverageExecutionTime();

  let statistics = {
    usersCount,
    assignmentsCount,
    executionsCount,
    assignments,
    queueSize,
    maxQueueCountReached,
    recentAverageExecutionTime
  };


  res.render("statistics", { statistics, date: new Date().toString(), user: req.user });
});

app.use("/favicon.ico", function(req, res) {
  res.status(204).end(); // No content for favicon requests
});

// error handler
app.use("/", function(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  try{
    // set locals, only providing error in development
    logger.error("Error occurred: " + err.message);
    logger.error(err.stack);
    res.locals.message = err.message;
    //res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.message = "An error occurred. Please try again later.";
    res.locals.error = "An error occurred. Please try again later.";
    
    // render the error page
    res.status(err.status || 500);
    return res.render('error');
  } catch (error) {
    logger.error("Error in error handler:", error.message);
    return res.status(500).send("Internal Server Error");
  }
});


/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});*/


module.exports = app;
