var http = require('http');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var pg = require('pg');
var connectionString = 'postgres://g1427136_u:5tTcpsouh0@db.doc.ic.ac.uk/g1427136_u';
var uploadPath = "/vol/project/2014/271/g1427136/"
var filePath = "http://www.doc.ic.ac.uk/project/2014/271/g1427136/";
var messageNo=0;
var messages = [];

var sessionKeys = [];

var disallowed = ["server"];

http.createServer(serverListener).listen(8082);
console.log("Listening...");

var postMap = {
    "chat/send_message" : function(request, response, params) {
        var username = getUser(request);
        messages.push({user:username, message:params.chatmessage});
        messageNo++;
    },
    "login/login" : function(request, response, params) {
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
    },
    "login/register":function(request, response, params) {
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
    },
    "fileupload/upload":function(request, response, data) {
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
}

var getMap = {
    "chat/last_chat_no" : function(request, response) {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end("" + messageNo);
    },
    "chat/chat_update" : function(request, response, params) {
        response.writeHead(200, { "Content-Type": 'text/plain' });
        var last = parseInt(params.last);
        response.write(messageNo + "#");
        while(last < messageNo)
        {
            response.write("<img src='" + filePath + "avatars/" + messages[last].user + ".png' />" + messages[last].user + ": " + messages[last].message + "<br />");
            last++;
        }
        response.end();
    }
}

function serverListener(request, response) {
    if(request.method=="POST") {
        var requestURL = request.url.substring(1);
        var handler = postMap[requestURL];
        if(handler != null) {
            var postType = request.headers["content-type"].split(';');
            if(postType[0] == "multipart/form-data")
            {
                handler(request, response, message);
                return;
            }
            var message = "";
            request.on("data", function(data) {
                message += data.toString('utf-8');
                if(message.length > 1e7) {
                    POSTDataTooBig(response);
                    return;
                }
            });
            request.on("end", function() {
                handler(request, response, splitParams(message));
            });
        }
        else
        {
            console.log("POST handler missing: " + request.url.substring(1));
            response.writeHead(200);
            response.end();
        }
        return;
    }

    var handler = getMap[request.url.substring(1).split("?")[0]];
    if(handler != null) {
        var paramString = request.url.split("?")[1];
        handler(request, response, splitParams(paramString));
        return;
    }

    if(requestDisallowed(request.url))
    {
        response.writeHead(403);
        response.end();
        return;
    }

    request.url = '..' + request.url;
    returnFile(request, response);
}

function returnFile(request, response) {
    var filePath = request.url;
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                console.log("404ing! " + filePath);
                fs.readFile('../404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else if(error.code == 'EISDIR') {
                if(filePath.slice(-1) != '/') {
                    response.writeHead(301, { 'Location':request.url+'/' });
                    response.end();
                } else {
                    request.url += "index.html";
                    return returnFile(request, response);
                }
            }
            else
            {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else 
        {
            response.writeHead(200, { 'Content-Type': contentType });
            if(contentType == "text/javascript")
            {
                fs.readFile('../lib.js', function(error, libcontent) {
                    response.write(libcontent, 'utf-8');
                    response.end(content, 'utf-8');
                });
            } else {
                response.end(content, 'utf-8');
            }
        }
    });
}

function POSTDataTooBig(response) {
    response.writeHead(413, 
           'Request Entity Too Large', {'Content-Type': 'text/html'});
    response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
}



function splitParams(string, splitOn) {
    if(!splitOn)
        splitOn = '&';
    var params = {};
    if(string == null || string == undefined) return params;
    var parts = string.split(splitOn);
    for (var i = 0; i < parts.length; i++) {
        var param = parts[i];
        var keyAndValue = param.split("=");
        params[keyAndValue[0].trim()] = keyAndValue[1].trim();
    }
    return params;
}

function requestDisallowed(url) {
    for(var i = 0; i < disallowed.length; i++)
    {
        if(url.slice(1, disallowed[i].length + 1) == disallowed[i])
            return true;
    }
    return false;
}

function respondPlain(response, text) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(text);
}

function getUser(request) {
    var cookie = request.headers.cookie;
    if(!cookie) return;
    var cookies = splitParams(cookie, ';');
    var seshCookie = cookies.seshCookie;
    if(!seshCookie) return;
    var user = sessionKeys[seshCookie];
    return user;
}
