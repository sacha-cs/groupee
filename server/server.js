var http = require('http');
path = require('path');
fs = require('fs');
formidable = require('formidable');
passwordHash = require('password-hash');
pg = require('pg');

utils = require('./utils');

postHandler = require('./postHandlers.js');
getHandler = require('./getHandlers.js');

require('./userFunctions');
require('./chatServer');


connectionString = 'postgres://g1427136_u:5tTcpsouh0@db.doc.ic.ac.uk/g1427136_u';
uploadPath = "/vol/project/2014/271/g1427136/"
filePath = "http://www.doc.ic.ac.uk/project/2014/271/g1427136/";

sessionKeys = [];

var disallowed = ["server"];

http.createServer(serverListener).listen(8085);
console.log("Listening...");

function serverListener(request, response) {
    if(request.method=="POST") {
        var requestURL = request.url.substring(1);
        var handler = postHandler.getHandler(requestURL);

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
                handler(request, response, utils.splitParams(message));
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


function requestDisallowed(url) {
    for(var i = 0; i < disallowed.length; i++)
    {
        if(url.slice(1, disallowed[i].length + 1) == disallowed[i])
            return true;
    }
    return false;
}
