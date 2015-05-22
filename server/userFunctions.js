
postHandler.addHandler("login/login", login);
postHandler.addHandler("login/register", register);
postHandler.addHandler("fileupload/upload", uploadAvatar);

function login(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            return console.error('error! :(', err);
        }
        var handleError = function(err) {
            if(!err) return false;
            console.log(err);
            done(client);
            response.writeHead(500, {'contentType': 'text/plain'});
            response.end('An error occurred. Contact the webmaster.');
            return true;
        }
        if(params.username && params.password)
        {
            client.query("SELECT * FROM users WHERE username='" + params.username.toLowerCase() + "'", function(err, result) {
                if(handleError(err)) return;
                done(client);
                if(result.rows.length != 0) {
                    var expected = result.rows[0].pwdhash;
                    if(passwordHash.verify(params.password, expected)) {
                        var seshCookie = Math.round(Math.random() * 4294967295);
                        sessionKeys["" + seshCookie] = params.username;
                        return utils.respondPlain(response,
                                            "Y" + seshCookie);
                    } else {
                        return utils.respondPlain(response, "NIncorrectPassword");
                    }
                } else {
                    return utils.respondPlain(response, "NNoUser");
                }
            });
        } else {
            return utils.respondPlain(response, "NEmptyFields");
        }
    });
}

function register(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
            return console.error('error! :(', err);
        }
        var handleError = function(err) {
            if(!err) return false;
            console.log(err);
            done(client);
            response.writeHead(500, {'contentType': 'text/plain'});
            response.end('An error occurred. Contact the webmaster.');
            return true;
        }

        if(params.username && params.password && params.passwordconfirm) {
            if (!usernameIsValid(params.username) || !passwordIsValid(params.password)) {
                return utils.respondPlain(response, "NInvalidCharacters");
            }
            client.query("SELECT * FROM users WHERE username='" + params.username.toLowerCase() + "'", function(err, checkQuery) {
                if(checkQuery.rows.length > 0) {
                    return utils.respondPlain(response, "NUsernameTaken");
                }

                if(params.password == params.passwordconfirm) {
                    var hashedPassword = passwordHash.generate(params.password);
                    client.query("INSERT INTO users(username, pwdhash) VALUES('" + 
                        params.username.toLowerCase() + "', '" + hashedPassword + "')", function(err, createQuery) {

                        client.query("SELECT * FROM users WHERE username='" + params.username.toLowerCase() + "'", function(err, finalCheckQuery) {
                            if(finalCheckQuery.rows.length > 0) {
                                // New user has just been created. 
                                fs.createReadStream(uploadPath + "avatar.png").pipe(fs.createWriteStream(uploadPath + "avatars/" + params.username.toLowerCase() + ".png"));
                                return utils.respondPlain(response, "YRegisteredSuccessfully");
                            } else {
                                return utils.respondPlain(response, "NUnknownError");
                            }
                        });

                    });
                } else {
                    return utils.respondPlain(response, "NPasswordsDifferent");
                }
            });
        } else {
            return utils.respondPlain(response, "NEmptyFields");
        }
    });
}

function uploadAvatar(request, response, data) {
    var form = new formidable.IncomingForm();
    form.uploadDir = '/vol/project/2014/271/g1427136/uploads';
    form.keepExtension = true;
    form.type = "multipart";
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

function usernameIsValid(username) {
    return /^[0-9a-zA-Z_.-]+$/.test(username);
}

function passwordIsValid(password) {
    return /^[0-9a-zA-Z_.-]+$/.test(password);
}
