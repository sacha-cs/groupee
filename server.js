var http = require('http');
var fs = require('fs');
var path = require('path');

var messageNo=0;
var messages = [];

http.createServer(serverListener).listen(8080);
console.log("Listening...");
function serverListener(request, response) {
    console.log("Request!!\n");
    if(request.method=="POST") {
        if(request.url=="send_message") {
            var message = "";
            request.on("data", function(data) {
                message += data.toString('utf-8');
                if(message.length > 1e7) {
                    response.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'text/html'});
                    response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
                }
            });
            request.on("end", function() {
                console.log("Message: " + message);
                messages.push(message);
                messageNo++;
            });
        }
        response.writeHead(200);
        response.end();
        return;
    }
    console.log(request.method);
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';
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
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
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
