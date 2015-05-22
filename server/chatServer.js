
var messageNo=0;
var messages = [];

postHandler.addHandler("chat/send_message", chatSendMessage);
getHandler.addHandler("chat/last_chat_no", lastChatNo);
getHandler.addHandler("chat/chat_update", chatUpdate);

function chatSendMessage(request, response, params) {
    var username = getUser(request);
    messages.push({user:username, message:params.chatmessage});
    messageNo++;
}

function lastChatNo(request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end("" + messageNo);
}

function chatUpdate(request, response, params) {
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
