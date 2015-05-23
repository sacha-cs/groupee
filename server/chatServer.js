var TIMEOUT_TIME = 10 * 1000;
var messageNo=0;
var messages = [];

var waitingRequests = [];

postHandler.addHandler("chat/send_message", chatSendMessage);
getHandler.addHandler("chat/last_chat_no", lastChatNo);
getHandler.addHandler("chat/chat_update", chatUpdate);

function chatSendMessage(request, response, params) {
    var username = utils.getUser(request);
    var safeMessage = escapeHtml(params.chatmessage);
    safeMessage = encodeURIComponent(safeMessage);
    messages.push({user:username, message:safeMessage});
    messageNo++;
    utils.respondPlain(response, "MessageRecieved");

    var i = 0;
    while(i < waitingRequests.length) {
        var curr = waitingRequests[i];
        if(username == utils.getUser(curr.request))
        {
            i++;
            continue;
        }
        waitingRequests.splice(i, 1);
        if(curr.timedOut)
            continue;
        clearTimeout(curr.timeoutID);
        curr.callback(curr.request, curr.response, curr.params);
    }
}

function lastChatNo(request, response) {
    utils.respondPlain(response, "" + messageNo);
}

function chatUpdate(request, response, params, checkForNew) {
    var last = parseInt(params.last);
    
    //If there are no more messages to send, add it to the waiting list 
    if(!checkForNew && last == messageNo)
    {
        var requestData = {"request":request,
                           "response":response,
                           "params":params,
                           "callback":chatUpdate,
                           "timedOut": false};
        var timeoutID = setTimeout(requestTimedOut, TIMEOUT_TIME, requestData);

        requestData.timeoutID = timeoutID;
        waitingRequests.push(requestData);
        
        return;
    }
    
    response.writeHead(200, { "Content-Type": 'text/plain' });
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

function requestTimedOut(requestData) {
    requestData.timedOut = true;
    chatUpdate(requestData.request, requestData.response, requestData.params, true);
}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
