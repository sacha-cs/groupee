postHandler.addHandler("login/login", login);
postHandler.addHandler("posts/add_note", addNote);
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
                var grouplist = [];
                for (i = 0; i < result.rows.length; i++) {
                    grouplist.push(result.rows[i].group_id);
                }
                user_info = {"username" : username, "groups" : grouplist};
                
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
    var groupname = params.group_name.toLowerCase();
    var description = params.description;
    var username = utils.getUser(request);
    var privacy = params.privacy.toLowerCase();

    // Check if the group name entered exists in the DB.
    var groupIdQuery = "SELECT group_id " +
                       "FROM groups " +
                       "WHERE group_name='" + groupname + "'";
  
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            console.log(err);
            return utils.respondPlain(response, "NServerError");
        }
        // Handle group insertion/creation.
        client.query(groupIdQuery, function(err, checkResult) {
            if(err) { return utils.respondError(err, response); }
          
            // If the group already exists, set the group id to the existing one.
            if (checkResult.rows.length > 0) {
                newGroupId = checkResult.rows[0].group_id;
                insertUserIntoMemberOf(request, response, client, done, function(request, response, client, done) { done(client); }, newGroupId, username);
            } else {
                // Group does not already exist, so we create a new one.
                var newGroupQuery = "INSERT INTO groups (group_name, privacy, description) " +
                                    "VALUES('" + groupname + "', '" + privacy + 
                                    "', '" + description + "')";
                client.query(newGroupQuery, function(err, checkResult) {
                    if(err) { return utils.respondError(err, response); }

                    // We must now extract the group id that was just created.
                    // 
                    extractGroupId(request, response, client, done, function(request, response, client, done, group_id) {
                        insertUserIntoMemberOf(request, response, client, done, function(request, response, client, done) { done(client); utils.respondPlain(response, "Y" + group_id) },
                                               group_id, username );
                    }, groupname);
                });
            }
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
    var getUserQuery = "SELECT username FROM member_of WHERE username='" + username + "' AND group_id='" + groupId + "'";
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
            callback(request, response, client, done);
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
                createAvatar(username);
      
                return utils.respondPlain(response, "YRegisteredSuccessfully");
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
                    function(request, response, client, done) {
                        done(client);
                        utils.respondPlain(response, "YUserAddedSuccessfully");
                    },
                groupID, username);
            }, 
        username);
    });

}

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
    
        if(result.rows.length == 0) {
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
                    utils.respondPlain(response, "Y");
                } else {
                    utils.respondPlain(response, "N");
                }
            }, params.group_id);
        });
}

function addNote(request, response, params) {

	pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err, response); }

		var groupId = utils.getViewingGroup(request);
		var username = utils.getUser(request);
        var noteTitle = params.noteTitle;
        var noteContent = params.noteContent;

		var insertNoteQuery = "INSERT INTO note_taker(group_id, username) " +
							  "VALUES('" + groupId + "', '" + username + "') RETURNING note_id";

	 	client.query(insertNoteQuery, function(err, result) {
			var noteId = result.rows[0].note_id;
			if (err) { return utils.respondError(err, response); }
            var insertNoteInfoQuery = "INSERT INTO note(note_id, note_title, note_content) " +
                                      "VALUES(" + noteId + ", '" + noteTitle + "', '" + noteContent + "')";
            client.query(insertNoteInfoQuery, function(err, result) {
                done(client);
                if (err) { return utils.respondError(err, response); }
                return utils.respondPlain(response, "Y");
            })
		})
	})
}

