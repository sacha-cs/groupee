postHandler.addHandler("login/login", login);
postHandler.addHandler("login/register", register);
postHandler.addHandler("groups/create", handleGroupInsertion);
postHandler.addHandler("fileupload/upload", uploadAvatar);
postHandler.addHandler("groups/add", addUserToGroup);
getHandler.addHandler("groups/add_users", setAddUsersGroup);
getHandler.addHandler("groups/get_all_groups", getAllGroups);
getHandler.addHandler("groups/set_viewing_group", setGroup);

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
            
            //Check if the user is already in a group.
            var inGroupQuery = "SELECT group_id FROM member_of WHERE username='" + username + "'";
            var user_info = {};
            client.query(inGroupQuery, function(err, result) {
                done(client);
                if(err) {
                    console.log(err);
                    return utils.respondPlain(response, "NServerError");
                }

                user_info = {"username" : username};
                //Create a new session cookie for the user and send it to them
                //seshCookie encodes the username and the groups that the user resides in.
                var seshCookie = createSessionCookie(user_info);
                return utils.respondPlain(response, "Y" + seshCookie + "#" + username);
            });
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

function handleGroupInsertion(request, response, params) {
    var groupname = params.group_name;
    var description = params.description;
    var username = utils.getUser(request);
    var privacy = params.privacy.toLowerCase();

    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            console.log(err);
            return utils.respondPlain(response, "NServerError");
        }
        // Group does not already exist, so we create a new one.
        var newGroupQuery = "INSERT INTO groups (group_name, privacy, description) " +
                            "VALUES('" + groupname + "', '" + privacy + 
                            "', '" + description + "') " +
                            "RETURNING group_id";
        client.query(newGroupQuery, function(err, result) {
            if(err) { return utils.respondError(err, response); }
            var group_id = result.rows[0].group_id;
            insertUserIntoMemberOf(request, response, client, done, 
                function() { 
                    addGroupChat(request, response, client, done,
                    function() {
                        done(client);
                        utils.respondPlain(response, "Y" + group_id)
                    }, group_id);
                },
            group_id, username );
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
            return utils.respondPlain(response, "NUserExistsInGroup");
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


function register(request, response, params) {

    checkParams(response, params);    

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
                return utils.respondPlain(response, "NUsernameTaken");
            }

            //Generate the password hash
            var hashedPassword = passwordHash.generate(params.password);
            
            //And insert into database
            usernameQuery = "INSERT INTO users(username, pwdhash) " +
                    "VALUES('" + username + "', '" + hashedPassword + "')";
            client.query(usernameQuery, function(err, checkResult) {
                if(err) { return utils.respondError(err, response); }
                
                // New user has just been created. 
                //createAvatar(username);
                // login automatically after registration
                var user_info = {"username" : username};
                var seshCookie = createSessionCookie(user_info);
                return utils.respondPlain(response, "Y" + seshCookie + "#" + username);
            });
        });
    });
}

function uploadAvatar(request, response, fields, files) {
    utils.respondPlain(response, "File Uploaded successfully!");

    var file = files.avatar;
    //TODO: pass around user? think about this.
    var user = utils.getUser(request);
    if(user)
    {
        fs.rename(file.path, uploadPath + "avatars/" + user + ".png");
    }
    return;
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

function createSessionCookie(user_info) {
    var seshCookie = Math.round(Math.random() * 4294967295);
    var cookieString = user_info.username;

    //TODO: have a not in group global const
    sessionKeys["" + seshCookie] = { username: user_info.username, groupViewing:-1 }
    return seshCookie;
}

function addUserToGroup(request, response, params) {
    var username = params.username.toLowerCase();
    var groupID = utils.getViewingGroup(request);


    pg.connect(connectionString, function(err, client, done) {
        checkUserExists(request, response, client, done,
            function(request, response, client, done) {
                insertUserIntoMemberOf(request, response, client, done, 
                    function() {
                        done(client);
                        utils.respondPlain(response, "YUserAddedSuccessfully");
                    },
                groupID, username);
            }, 
        username);
    });

}

//TODO: Factor out - duplication with setGroup.
function setAddUsersGroup(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        doesUserExistInGroup(request, response, client, done,
            function(request, response, client, done, userExists) {
                done(client);
                if(userExists) {
                    // Safety check done
                    // Remember that the user is viewing that group from session cookie before redirecting
                    utils.setViewingGroup(request, params.group_id);
                    response.writeHead("307", {'Location' : 'add_users.html' });
                } else {
                    response.writeHead("307", {'Location' : '/404.html' });
                }
                response.end();
            }, params.group_id);
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
            // Safety check done
            // Remember that the user is viewing that group from session cookie before redirecting
            callback(request, response, client, done, true);
        } else {
            callback(request, response, client, done, false);
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
            
            var responseString = "";
            if(result.rows.length > 0) {
              /* Populate the groupInfo array with information about the groups associated with
                 the current user. */
                for(var i = 0; i < result.rows.length; i++) {
                    var row = result.rows[i];
                    var name = row.group_name;
                    var desc = encodeURIComponent(row.description);
                    var id = row.group_id;
                    responseString += "name=" + name + "&description=" + desc + "&group_id=" + id + "#";
                }
            } else {
                /* TODO: Handle case when user isn't associated with any groups. */
            }
            response.write(responseString);
            response.end();
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
    
        if(result.rows[0].length == 0) {
            done(client);
            return utils.respondPlain(response, "NUserDoesNotExist");
        }

        callback(request, response, client, done);
    });
}

function setGroup(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        doesUserExistInGroup(request, response, client, done,
            function(request, response, client, done, userExists) {
                if(userExists) {
                    // Safety check done
                    // Remember that the user is viewing that group from session cookie before redirecting
                    utils.setViewingGroup(request, params.group_id);
                    var viewingGroupName = "";
                    var getGroupNameQuery = "SELECT group_name FROM groups WHERE group_id='" + params.group_id + "'";
                    client.query(getGroupNameQuery, function(err, result) {
                        if(err) { return respondError(err, response); }
                        done(client);
                        if (result.rows.length > 0) {
                            viewingGroupName = encodeURIComponent(result.rows[0].group_name);
                        }
                        utils.respondPlain(response, "Y" + viewingGroupName);   
                    });
                } else {
                    utils.respondPlain(response, "N");
                }
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
            if(err) { return utils.respondErr(response, err); }
            callback(chat_id);
        });
    });

}
