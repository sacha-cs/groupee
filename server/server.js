var http = require('http');
path = require('path');
fs = require('fs');
formidable = require('formidable');
passwordHash = require('password-hash');
pg = require('pg');
FormData = require("form-data");

utils = require('./utils');

postHandler = require('./postHandlers.js');
getHandler = require('./getHandlers.js');

require('./userFunctions');
chat = require('./chatServer');
require('./todosServer');
require('./noteServer');
require('./whiteboardServer');
require('./calendarServer');
require('./photosServer');
require('./documentsServer');
notificationServer = require('./notificationServer');

connectionString = 'postgres://zhiqcqrrpvrhin:kyDKPUF4T1iKHEt_uG6h85YEYX@ec2-54-204-20-209.compute-1.amazonaws.com:5432/d6s1veg7u54ta5?ssl=true';
filePath = "http://natpat.net/groupee/";

sessionKeys = [];

var disallowed = ["server"];
var anonAvailable = ["login", "favicon.ico"];

getHandler.addHandler("favicon.ico", faviconResponse);
getHandler.addHandler("", redirectToHome);

var port = process.argv[2];
if(!port)
    port = 8080;
else if(port == "heroku")
    port = process.env.PORT 
else
    port = parseInt(port);

http.createServer(serverListener).listen(port);
chat.getAllChatHistory();
console.log("Listening on port " + port);

function serverListener(request, response) {
    //If we're not logged in, then there are only some requests we should
    //respond to.
    if(!utils.getUser(request) && !requestAnonAvailable(request.url)) {
        response.writeHead("307", {'Location' : '/login/' });
        response.end();
        return;
    }
    if(request.method=="POST") {
        var requestURL = request.url.substring(1).split('?')[0];
        console.log(requestURL);
        var handler = postHandler.getHandler(requestURL);
        if(handler != null) {
            if(!postHandler.useOwn(requestURL)) {
                var form = new formidable.IncomingForm();
                form.uploadDir = '../tmp';
                form.keepExtensions = true;
                form.on("error", function(error) {
                    console.log(error);
                });

                var options = postHandler.getOptions(requestURL);
                if(options) {
                    for(var i in options) {
                        if(options.hasOwnProperty(i)) {
                            form[i] = options[i];
                        }
                    }
                }

                form.parse(request, function(err, fields, files) {
                    handler(request, response, fields, files);
                });
            } else {
                var message = "";
                request.on("data", function(data) {
                    message += data.toString('utf-8');
                    if(message.length > 1e7) {
                        POSTDataTooBig(response);
                        return;
                    }
                });
                request.on("end", function() {
                    handler(request, response, message);
                });
            }
        }
        else
        {
            console.log("POST handler missing: " + request.url.substring(1));
            response.writeHead(200);
            response.end();
        }
        return;
    }

    var handler = getHandler.getHandler(request.url.substring(1).split("?")[0]);
    if(handler != null) {
        var paramString = request.url.split("?")[1];
        handler(request, response, utils.splitParams(paramString));
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
        case '.mp3':
            contentType = 'audio/mp3';
            break;
    }
    
    var encoding = '';
    if(contentType == 'text/html' || contentType == 'text/js')
        encoding = 'utf-8';
    fs.readFile(filePath, encoding, function(error, content) {
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
            } else if (contentType == "text/html") {
                var templateTag = "<?template?>"
                if(content.slice(0, templateTag.length) == templateTag) {
                    replaceAllTags(content, function(replacedContent) {
                        response.end(replacedContent);
                    })
                } else {
                    response.end(content, 'utf-8');
                }
            } else {
                response.end(content, 'utf-8');
            }
        }
    });
}

function replaceAllTags(content, callback) {
    content = content.replace(new RegExp("\n", "g"), "");
    var tags = content.split("<?");
    //First element will be empty so get rid of it
    tags.shift();
    var templateFile = tags[0].split("?>")[1];
    fs.readFile(".." + templateFile, 'utf-8', function(err, template) {
        if(err) { callback(content); }
        for(var i = 1; i < tags.length; i++) {
            var keyAndValue = tags[i].split("?>");
            var key = keyAndValue[0];
            var value = keyAndValue[1];
            template = template.replace("<?" + key + "?>", value);
        }
        callback(template);
    });
}

function replaceTag(content, tag, file, callback) {
    var index = content.search("<\\?" + tag + "\\?>");
    if (index != -1) {
        fs.readFile(file, function(error, newContent) {
            content = content.replace("<?" + tag + "?>", newContent);
            callback(content);
        });
    } else {
        callback(content);
    }
}

function POSTDataTooBig(response) {
    response.writeHead(413, 
           'Request Entity Too Large', {'Content-Type': 'text/html'});
    response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
}


function requestAnonAvailable(url) {
    for(var i = 0; i < anonAvailable.length; i++)
    {
        if(url.slice(1, anonAvailable[i].length + 1) == anonAvailable[i])
            return true;
    }
    return false;
}

function requestDisallowed(url) {
    for(var i = 0; i < disallowed.length; i++)
    {
        if(url.slice(1, disallowed[i].length + 1) == disallowed[i])
            return true;
    }
    return false;
}

function faviconResponse(request, response) {
    response.writeHead("301", {"Location": "http://natpat.net/groupee/icons/favicon.ico"});
    response.end();
}

function redirectToHome(request, response) {
    response.writeHead("301", {"Location": "home"});
    response.end();
}
