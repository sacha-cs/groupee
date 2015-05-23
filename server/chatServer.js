
var messageNo=0;
var messages = [];

postHandler.addHandler("chat/send_message", chatSendMessage);
getHandler.addHandler("chat/last_chat_no", lastChatNo);
getHandler.addHandler("chat/chat_update", chatUpdate);

function chatSendMessage(request, response, params) {
    var username = utils.getUser(request);
    messages.push({user:username, message:params.chatmessage});
    messageNo++;
    utils.respondPlain(response, "MessageRecieved");
}

function lastChatNo(request, response) {
    utils.respondPlain(response, "" + messageNo);
}

function chatUpdate(request, response, params) {
    response.writeHead(200, { "Content-Type": 'text/plain' });
    var last = parseInt(params.last);
    response.write(messageNo + "#");
    while(last < messageNo)
    {
        if(messages[last].user == utils.getUser(request))
        {
            last++;
            continue;
        }
        //TODO: Handle case of users potentially sending semi-colons. 
        response.write("user=" + messages[last].user + ";message=" + messages[last].message + "\n");
        last++;
    }
    response.end();
}
