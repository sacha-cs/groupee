
postHandler.addHandler("login/login", login);
postHandler.addHandler("login/register", register);
postHandler.addHandler("fileupload/upload", uploadAvatar);

function login(request, response, params) {

    //Check we have both a username and password
    if(!params.username || !params.password) {
        return utils.respondPlain(response, "NEmptyFields");
    }
    
    //Usernames are all lowercase
    var username = params.username.toLowerCase();
    
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            console.log(err);
            return utils.respondPlain(response, "NServerError");
        }
        
        var query = "SELECT * " +
                    "FROM users " +
                    "WHERE username='" + username + "'";
        client.query(query, function(err, result) {
            done(client);

            if(err) {
                console.log(err);
                return utils.respondPlain(response, "NServerError");
            }
            
            //If the user does not exit (i.e. no rows where username matches)
            if(result.rows.length == 0) {
                return utils.respondPlain(response, "NNoUser");
            }
    
            //Get the password hash from the database and compare it to
            //the password received.
            var expected = result.rows[0].pwdhash;
            
            //If the password doesn't match
            if(!passwordHash.verify(params.password, expected)) {
                return utils.respondPlain(response, "NIncorrectPassword");
            }

            //Create a new session cookie for the user and send it to them
            var seshCookie = createSessionCookie(username);
            return utils.respondPlain(response, "Y" + seshCookie + "#" + username);
        });
    });
}

function checkParams(response, params) {
    if(!params.username || !params.password || !params.passwordconfirm) {
            return utils.respondPlain(response, "NEmptyFields");
    }

    if (!nameIsValid(params.username) || 
        !nameIsValid(params.group) ||
        !passwordIsValid(params.password)) {
        return utils.respondPlain(response, "NInvalidCharacters");
    }

    if (params.password != params.passwordconfirm) {
        return utils.respondPlain(response, "NPasswordsDifferent");
    }
}

function register(request, response, params) {

    checkParams(response, params);    

    //Usernames are all lowercase
    var username = params.username.toLowerCase();
    var groupname = params.group.toLowerCase();    

    pg.connect(connectionString, function(err, client, done) {
        if(err) { return respondError(err, response); }

        //Check username isn't taken
        var usernameQuery = "SELECT * " +
                    "FROM users " +
                    "WHERE username='" + username + "'";

        //Check if the group name entered exists in the DB.
        var groupIdQuery = "SELECT group_id " +
                    "FROM groups " +
                    "WHERE group_name='" + groupname + "'";

        // Handle user insertion.
        client.query(usernameQuery, function(err, checkResult) {
            if(err) { return respondError(err, response); }
            
            if(checkResult.rows.length > 0) {
                return utils.respondPlain(response, "NUsernameTaken");
            }

            //Generate the password hash
            var hashedPassword = passwordHash.generate(params.password);
            
            //And insert into database
            usernameQuery = "INSERT INTO users(username, pwdhash) " +
                    "VALUES('" + username + "', '" + hashedPassword + "')";
            client.query(usernameQuery, function(err, checkResult) {
                done(client);
                if(err) { return respondError(err, response); }
                
                // New user has just been created. 
                createAvatar(username);
               // return utils.respondPlain(response, "YRegisteredSuccessfully");

                // Handle group insertion/creation.
                console.log("Gonna handle group insertion");
                client.query(groupIdQuery, function(err, checkResult) {
                    done(client);
                    if(err) { console.log("GOT HERE"); return respondError(err, response); }
                  
                    var newGroupId = 0;
          
                    // If the group already exists, set the group id to the existing one.
                    if (checkResult.rows.length > 0) {
                        newGroupId = checkResult.rows[0].group_id;
                    } else {
                        // Group does not already exist, so we create a new one.
                        var groupDesc = "This group has no description.";
                        newGroupId = Math.floor((Math.random() * 100) + 1);
                        var newGroupQuery = "INSERT INTO groups VALUES('" + newGroupId + "', '" + groupname + "', '" + groupDesc + "')";
                        client.query(newGroupQuery, function(err, checkResult) {
                            done(client);
                            if(err) { return respondError(err, response); }
                            // Group was successfully created.
                        });
                    }
                    // Insert user into the group.
                    groupInsertQuery = "INSERT INTO member_of VALUES('" + newGroupId + "', '" + username + "')";
                    client.query(groupInsertQuery, function(err, checkResult) {
                        done(client);
                        if(err) { return respondError(err, response); }
                        // User has been inserted into appropriate group.
                        return utils.respondPlain(response, "YInsertedIntoGroupSuccessfully");
                    });
                });
            });
        });
    });
}

function uploadAvatar(request, response, data) {
    var form = new formidable.IncomingForm();
    form.uploadDir = '/vol/project/2014/271/g1427136/uploads';
    form.keepExtensions = true;
    form.on("error", function(error) {
        console.log(error);
    });
    form.parse(request, function(err, fields, files) {
        if(err)
        {
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end("Upload failed. :(");
            return;
        }
        utils.respondPlain(response, "File Uploaded successfully!");

        var file = files.avatar;
        //TODO: pass around user? think about this.
        var user = utils.getUser(request);
        if(user)
        {
            fs.rename(file.path, uploadPath + "avatars/" + user + ".png");
        }
        return;
    });
}

function createAvatar(username) {
    var defaultAvatar = fs.createReadStream(uploadPath + "avatar.png");
    var newAvatar = fs.createWriteStream(uploadPath + "avatars/" + username + ".png")
    defaultAvatar.pipe(newAvatar);
}

function nameIsValid(name) {
    return /^[0-9a-zA-Z_.-]+$/.test(name);
}


function passwordIsValid(password) {
    return /^[0-9a-zA-Z_.-]+$/.test(password);
}

function createSessionCookie(user) {
    var seshCookie = Math.round(Math.random() * 4294967295);
    sessionKeys["" + seshCookie] = user;
    return seshCookie;
}

function respondError(err, response) {
    console.log(err);
    return utils.respondPlain(response);
}
