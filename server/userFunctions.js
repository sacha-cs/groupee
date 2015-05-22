
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
            response.writeHead(200, {'contentType': 'text/plain'});
            response.end('NUnknown');
            return true;
        }
        if(params.username && params.password)
        {
            client.query("SELECT password FROM users WHERE username='" + params.username.toLowerCase() + "'", function(err, result) {
                if(handleError(err)) return;
                done(client);
                if(result.rows.length != 0) {
                    if(result.rows[0].password == params.password) {
                        var seshCookie = Math.round(Math.random() * 4294967295);
                        sessionKeys["" + seshCookie] = params.username;
                        return respondPlain(response,
                                            "Y" + seshCookie);
                    } else {
                        return respondPlain(response, "NIncorrectPassword");
                    }
                } else {
                    return respondPlain(response, "NNoUser");
                }
            });
        } else {
            return respondPlain(response, "NEmptyFields");
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
            client.query("SELECT * FROM users WHERE username='" + params.username.toLowerCase() + "'", function(err, checkQuery) {
                if(checkQuery.rows.length > 0) {
                    return respondPlain(response, "NUsernameTaken");
                }

                if(params.password == params.passwordconfirm) {
                    client.query("INSERT INTO users(username, password, pwdhash) VALUES('" + 
                        params.username + "', '" + params.password + "', '" + params.password + "')", function(err, createQuery) {

                        client.query("SELECT * FROM users WHERE username='" + params.username + "'", function(err, finalCheckQuery) {
                            if(finalCheckQuery.rows.length > 0) {
                                return respondPlain(response, "YRegisteredSuccessfully");
                            } else {
                                return respondPlain(response, "NUnknownError");
                            }
                        });

                    });
                } else {
                    return respondPlain(response, "NPasswordsDifferent");
                }
            });
        } else {
            return respondPlain(response, "NEmptyFields");
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
        respondPlain(response, "File Uploaded successfully!");

        var file = files.avatar;
        //TODO: pass around user? think about this.
        var user = getUser(request);
        if(user)
        {
            fs.rename(file.path, uploadPath + "avatars/" + user + ".png",
                      function() {});
        }
        return;
    });
}

