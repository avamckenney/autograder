
const checkRolePermission = (roleName) => {
    return (req, res, next) => {
        // Check if the user is authenticated
        if (req.isAuthenticated() && req.user) {
            if(roleName === "admin" && req.user.role !== "admin") {
                console.log("User is authenticated but not an admin, redirecting to unauthorized page");
                return res.status(403).send("Unauthorized: Admin access required");
            }else if(roleName === "student" && (req.user.role !== "student" && req.user.role !== "admin")) {
                console.log("User is authenticated but not a student or admin, redirecting to unauthorized page");
                return res.status(403).send("Unauthorized: Student access required");
            }

            return next();
        } else {
            console.log("User is not authenticated, redirecting to login");
            return res.redirect("/login.html");
        }
    };
}


module.exports = { checkRolePermission };