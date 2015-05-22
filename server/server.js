var http = require('http');
var fs = require('fs');
var path = require('path');
var pg = require('pg');
var connectionString = 'postgres://g1427136_u:5tTcpsouh0@db.doc.ic.ac.uk/g1427136_u';

var messageNo=0;
var messages = [];

var disallowed = ["server"];

var postMap = {
    "chat/send_message" : function(request, response, params) {
        messages.push(params.chatmessage);
        messageNo++;
    },
    "sacha/login" : function(request, response, params) {
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
                client.query("SELECT password FROM users WHERE username='" + params.username + "'", function(err, result) {
                    if(handleError(err)) return;
                    done(client);
                    if(result.rows.length != 0) {
                        if(result.rows[0].password == params.password)
                        {
                            response.writeHead(301, {'Location': '/chat/'});
                            response.end();
                        }
                        else
                        {
                            response.writeHead(200, {'contentType': 'text/plain'});
                            response.end('Wrong password.');
                        }
                    }
                    else
                    {
                        response.writeHead(500, {'contentType': 'text/plain'});
                        response.end('No-one with that username exists.');
                    }
                });
            } 
            else
            {
                response.writeHead(500, {'contentType': 'text/plain'});
                response.end('Please fill out username and password.');
            }
        });
    },
    "sacha/register":function(request, response, params) {
        
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
            response.write(messages[last] + "<br />");
            last++;
        }
        response.end();
    }
}

http.createServer(serverListener).listen(80);
console.log("Listening...");

function serverListener(request, response) {
    if(request.method=="POST") {
        var requestURL = request.url.substring(1);
        var handler = postMap[requestURL];
        if(handler != null) {
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
                if(filePath.slice(-1) != '/')
                {
                    response.writeHead(301, { 'Location':request.url+'/' });
                    response.end();
                }
                request.url += "index.html";
                return returnFile(request, response);
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
            response.end(content, 'utf-8');
        }
    });
}

function POSTDataTooBig(response) {
    response.writeHead(413, 
           'Request Entity Too Large', {'Content-Type': 'text/html'});
    response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
}

function splitParams(string) {
    var params = {};
    if(string == null || string == undefined) return params;
    var parts = string.split("&");
    for (var i = 0; i < parts.length; i++) {
        var param = parts[i];
        var keyAndValue = param.split("=");
        params[keyAndValue[0]] = keyAndValue[1];
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
