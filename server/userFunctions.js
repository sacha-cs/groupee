postHandler.addHandler("login/login", login);
postHandler.addHandler("login/register", register);
getHandler.addHandler("login/logout", logout);
postHandler.addHandler("groups/create", createNewGroup, true);
postHandler.addHandler("groups/add", addUserToGroup);
getHandler.addHandler("groups/get_all_groups", getAllGroups);
getHandler.addHandler("groups/set_viewing_group", setGroup);
postHandler.addHandler("usersettings/change_avatar", changeAvatar);
postHandler.addHandler("usersettings/change_password", changePassword);

var FormData = require("form-data");

function login(request, response, params) {

    //Check we have both a username and password
    if(!params.username || !params.password) {
        payload.error = "Please fill out all fields";
        return utils.respondJSON(response, payload);
    }
    
    //Usernames are all lowercase
    var username = params.username.toLowerCase();
    
    pg.connect(connectionString, function(err, client, done) {
        payload = {
            success : false
        }
        if(err) {
            console.log(err);
            payload.error = "Internal Server Error";
            return utils.respondJSON(response, payload);
        }
        
        var query = "SELECT * " +
                    "FROM users " +
                    "WHERE username='" + username + "'";
        client.query(query, function(err, result) {
            done(client);
            if(err) {
                console.log(err);
                payload.error = "Internal Server Error";
                return utils.respondJSON(response, payload);
            }
            
            //If the user does not exit (i.e. no rows where username matches)
            if(result.rows.length == 0) {
                payload.error = "No user with that username";
                return utils.respondJSON(response, payload);
            }
    
            //Get the password hash from the database and compare it to
            //the password received.
            var expected = result.rows[0].pwdhash;
            
            //If the password doesn't match
            if(!passwordHash.verify(params.password, expected)) {
                payload.error = "Incorrect Password";
                return utils.respondJSON(response, payload);
            }
            
            user_info = {"username" : username};
            //Create a new session cookie for the user and send it to them
            var seshCookie = createSessionCookie(user_info);
            payload.success = true;
            payload.seshCookie = seshCookie;
            payload.username = username;
            return utils.respondJSON(response, payload);
        });
    });
}

function logout(request, response) {
    var seshCookie = utils.getSessionCookie(request);
    delete sessionKeys[seshCookie];
    utils.respondJSON(response, { success: true });
}

function checkParams(response, params) {
    var payload = {
        success:false,
    }
    if(!params.username || !params.password || !params.passwordconfirm) {
        payload.error = "Please fill out all fields";
        utils.respondJSON(response, payload);
        return true;
    }

    if (!nameIsValid(params.username) || 
        !nameIsValid(params.group) ||
        !passwordIsValid(params.password)) {
        payload.error = "Invalid characters in username/password";
        utils.respondJSON(response, payload);
        return true;
    }

    if (params.password != params.passwordconfirm) {
        payload.error = "Passwords different";
        utils.respondJSON(response, payload);
        return true;
    }

    return false;
}

function register(request, response, params) {

    if(checkParams(response, params)) {
        return;
    }

    //Usernames are all lowercase
    var username = params.username.toLowerCase();

    pg.connect(connectionString, function(err, client, done) {
        if(err) { return utils.respondError(err, response); }

        //Check username isn't taken
        var usernameQuery = "SELECT * " +
                    "FROM users " +
                    "WHERE username='" + username + "'";

        // Handle user insertion.
        client.query(usernameQuery, function(err, checkResult) {
            if(err) { return utils.respondError(err, response); }
            
            if(checkResult.rows.length > 0) {
                var payload = {
                    success: false,
                    error: "Username already taken"
                };
                return utils.respondJSON(response, payload);
            }

            //Generate the password hash
            var hashedPassword = passwordHash.generate(params.password);
            
            //And insert into database
            usernameQuery = "INSERT INTO users(username, pwdhash) " +
                    "VALUES('" + username + "', '" + hashedPassword + "')";
            client.query(usernameQuery, function(err, checkResult) {
                if(err) { return utils.respondError(err, response); }
                done(client);
                
                // New user has just been created. 
                createAvatar(username);
                // login automatically after registration
                var user_info = {"username" : username};
                var seshCookie = createSessionCookie(user_info);
                var payload = {
                    success: true,
                    seshCookie: seshCookie,
                    username: username
                };
                return utils.respondJSON(response, payload);
            });
        });
    });
}

function createNewGroup(request, response, params) {
    params = JSON.parse(params);
    var groupname = params.group_name;
    var description = params.description;
    var username = utils.getUser(request);
    var privacy = params.privacy.toLowerCase();

    var payload = {};
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            console.log(err);
            return utils.respondError(err, response);
        }

        description = description.replace(/'/g, "''");
        groupname = groupname.replace(/'/g, "''");
        var newGroupQuery = "INSERT INTO groups (group_name, privacy, description) " +
                            "VALUES('" + groupname + "', '" + privacy + 
                            "', '" + description + "') " +
                            "RETURNING group_id";
        client.query(newGroupQuery, function(err, result) {
            if(err) { return utils.respondError(err, response); }
            var groupId = result.rows[0].group_id;
            insertUserIntoMemberOf(request, response, client, done, 
                function() { 
                    addGroupChat(request, response, client, done,
                    function() {
                        done(client);
                        payload.success = true;
                        utils.setViewingGroup(request, groupId);
                        utils.respondJSON(response, payload)
                    }, groupId);
                },
            groupId, username );
        });
    });
}

function extractGroupId(request, response, client, done, callback, group_name) {
    var idExtractQuery = "SELECT group_id FROM groups WHERE group_name='" + group_name + "'";
    client.query(idExtractQuery, function(err, result) {
        if(err) {return utils.respondError(err, response); } 
           
        if (result.rows.length > 0) {
            callback(request, response, client, done, result.rows[0].group_id);
        }
    });
    
}

function insertUserIntoMemberOf(request, response, client, done, callback, groupId, username) {
    var payload = {
        success: false,
        error: ""
    }
    // Given that the user does not already exist in the group, insert user into the group.
    var getUserQuery = "SELECT username " + 
                       "FROM member_of " +
                       "WHERE username='" + username + "' " +
                       "AND group_id='" + groupId + "'";
    client.query(getUserQuery, function(err, result) {
        if(err) { 
            done(client);
            return utils.respondError(err, response); 
        }
    
        if(result.rows.length > 0) {
            done(client);
            payload.error = "User is already in group"
            return utils.respondJSON(response, payload);
        }
        
        var groupInsertQuery = "INSERT INTO member_of VALUES('" + groupId + "', '" + username + "')";
        client.query(groupInsertQuery, function(err, result) {
            if(err) { 
                done(client);
                return utils.respondError(err, response); 
            }
            // User has been inserted into appropriate group.
            callback();
        });
    });
}

function createAvatar(user) {
    var form = new FormData();
    form.append("username", user);
    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/setDefaultAvatar.php', function (error, response) {});
}

function nameIsValid(name) {
    return /^[0-9a-zA-Z_.-]+$/.test(name);
}


function passwordIsValid(password) {
    return /^[0-9a-zA-Z_.-]+$/.test(password);
}

function createSessionCookie(user_info) {
    var seshCookie = Math.round(Math.random() * 4294967295);
    var cookieString = user_info.username;

    sessionKeys["" + seshCookie] = { username: user_info.username, groupViewing:-1 }
    return seshCookie;
}

function addUserToGroup(request, response, params) {
    var username = params.username.toLowerCase();
    var groupID = utils.getViewingGroup(request);

    pg.connect(connectionString, function(err, client, done) {
        checkUserExists(request, response, client, done,
            function() {
                insertUserIntoMemberOf(request, response, client, done, 
                    function() {
                        done(client);
                        var payload = {
                            success: true,
                        }
                        utils.respondJSON(response, payload);
                    },
                groupID, username);
            }, 
        username);
    });

}

function doesUserExistInGroup(request, response, client, done, callback, groupID) {
    var username = utils.getUser(request);

    // Check user is member of the group
    var checkUserMemberQuery = "SELECT * " +
                               "FROM member_of " +
                               "WHERE username='" + username + "' AND group_id=" + groupID;

    client.query(checkUserMemberQuery, function(err, checkUserMemberResult) {
        if(err) { return utils.respondError(err, response); }

        if(checkUserMemberResult.rows.length == 1) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

function getAllGroups(request, response) {
    var currentUser = utils.getUser(request);
    var getGroupInfoQuery = "SELECT group_name, description, group_id " + 
                            "FROM groups NATURAL JOIN member_of " + 
                            "WHERE username='" + currentUser + "'";
    pg.connect(connectionString, function(err, client, done) {
        client.query(getGroupInfoQuery, function(err, result) {
            done(client);
            if(err) { return utils.respondError(err, response); }
            
            var payload = {
                success: true,
                groups: []
            };
            if(result.rows.length > 0) {
                for(var i = 0; i < result.rows.length; i++) {
                    var row =  result.rows[i];
                    payload.groups.push({
                        name: row.group_name,
                        desc: row.description,
                        id: row.group_id
                    });
                }
            }
            utils.respondJSON(response, payload);
        });
    });
}

function checkUserExists(request, response, client, done, callback, username) {
    var getUserQuery = "SELECT username FROM users WHERE username='" + username + "'";
    client.query(getUserQuery, function(err, result) {
        if(err) { 
            done(client);
            return utils.respondError(err, response); 
        }
    
        if(result.rows.length == 0) {
            done(client);
            var payload = {
                success: false,
                error: "User does not exist"
            }
            return utils.respondJSON(response, payload);
        }

        callback();
    });
}

function setGroup(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        doesUserExistInGroup(request, response, client, done,
            function(inGroup) {
                var payload = {
                    success: false
                }

                if(!inGroup) {
                    return utils.respondJSON(response, payload);
                }

                utils.setViewingGroup(request, params.group_id);
                var getGroupNameQuery = 
                    "SELECT group_name " +
                    "FROM groups " +
                    "WHERE group_id='" + params.group_id + "'";
                client.query(getGroupNameQuery, function(err, result) {
                    done(client);
                    if(err) { return respondError(err, response); }
                    payload.success = true;
                    payload.name = result.rows[0].group_name;
                    utils.respondJSON(response, payload);   
                });
            }, params.group_id);
        });
}

function addGroupChat(request, response, client, done, callback, group_id) {
    var query = "INSERT INTO chats(type) VALUES('group') RETURNING chat_id;"
    client.query(query, function(err, result) {
        if(err) { return utils.respondError(response, err); }
        var chat_id = result.rows[0].chat_id;
        var groupQuery = "INSERT INTO group_chats " +
                         "VALUES(" + chat_id + ", " + group_id + ");";
        client.query(groupQuery, function(err, result) {
            if(err) { return utils.respondError(response, err); }
            callback(chat_id);
        });
    });
}

function changeAvatar(req, response, data) {
    var user = utils.getUser(req);
    var fileName = user + '.png';

    var form = new FormData();
    form.append('username', user);
    form.append('avatar', fs.createReadStream('../tmp/' + fileName), {
        filename : fileName
    });

    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/uploadAvatar.php', function (err, res) {
        fs.unlink('../tmp/' + fileName);
        response.writeHead("303", {'Location' : '/usersettings/' });
        response.end();
    });

}   

function changePassword(request, response, params) {
    var user = utils.getUser(request);
    var payload = {
        success: false
    }

    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            return utils.respondError(err, response);
        }
        
        var checkCorrectPasswordQuery = "SELECT * " +
                                        "FROM users " +
                                        "WHERE username='" + user + "'";
    
        client.query(checkCorrectPasswordQuery, function(err, checkCorrectPasswordResult) {
            if(err) {
                done(client);
                return utils.respondError(err, response);
            }
    
            var expected = checkCorrectPasswordResult.rows[0].pwdhash;
            
            if(!passwordHash.verify(params.currentPassword, expected)) {
                payload.error = "Incorrect Password";
                return utils.respondJSON(response, payload);
            }

            var hashedNewPassword = passwordHash.generate(params.newPassword);
            var changePasswordQuery = 
                "UPDATE users " +
                "SET pwdhash='" + hashedNewPassword + "' " +
                "WHERE username='" + user + "'";
            client.query(changePasswordQuery, function(err, result) {
                done(client);
                if(err) { return utils.respondError(err, response); }
                payload.success = true;
                return utils.respondJSON(response, payload);
            });
        });
    });
}

function createGroupDirectory(group_id) {
    var form = new FormData();
    form.append('group_id', group_id);

    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/createGroupDirectory.php', function (err, res) {
    });
}
