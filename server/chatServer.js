var TIMEOUT_TIME = 10 * 1000;
var messageNo=0;

var groups = {};

postHandler.addHandler("chat/send_message", chatSendMessage);
getHandler.addHandler("chat/chat_update", chatUpdate);

function createGroupData(group) {
    groups[group] = { messageNo: 0,
                     messages : [],
                     waitingRequests: [] };
}

function chatSendMessage(request, response, params) {
    var username = utils.getUser(request);
    var group = utils.getViewingGroup(request);
    var safeMessage = encodeURIComponent(escapeHtml(decodeURIComponent(params.chatmessage)));
    if(!groups[group])
        createGroupData(group);
    groups[group].messages.push({user:username, message:safeMessage});
    groups[group].messageNo++;
    utils.respondPlain(response, "MessageRecieved");

    while(groups[group].waitingRequests.length > 0) {
        var curr = groups[group].waitingRequests.shift();
        if(curr.timedOut)
            continue;
        clearTimeout(curr.timeoutID);
        curr.callback(curr.request, curr.response, curr.params);
    }

    pg.connect(connectionString, function(err, client, done) {
        var getGroupQuery = "SELECT chat_id " +
                            "FROM group_chats " +
                            "WHERE group_id="+group + ";";
        client.query(getGroupQuery, function(err, result) {
            if(err) { return console.log(err); }
            var chatID = result.rows[0].chat_id;
            var addMessageQuery = "INSERT INTO chat_messages " +
                                  "VALUES(" + chatID + ", '" + username +
                                      "', now(), '" + safeMessage + "');"
            client.query(addMessageQuery, function(err, result) {
                if(err) { return console.log(err); }
                done(client);
            });
        });
    });
}

function chatUpdate(request, response, params, checkForNew) {
    var last = parseInt(params.last);
    
    var group = utils.getViewingGroup(request);

    if(!groups[group]) 
        createGroupData(group);

    //If there are no more messages to send, add it to the waiting list 
    if(!checkForNew && last == groups[group].messageNo)
    {
        var requestData = {"request":request,
                           "response":response,
                           "params":params,
                           "callback":chatUpdate,
                           "timedOut": false};
        var timeoutID = setTimeout(requestTimedOut, TIMEOUT_TIME, requestData);

        requestData.timeoutID = timeoutID;
        groups[group].waitingRequests.push(requestData);
        
        return;
    }
    
    response.writeHead(200, { "Content-Type": 'text/plain' });
    response.write(groups[group].messageNo + "#");
    while(last < groups[group].messageNo)
    {
        var message = groups[group].messages[last];
        response.write("user=" + message.user + ";message=" + message.message + "\n");
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
        "'": '&#039;',
        "=": '&#061;'
    };

    return text.replace(/[&<>"'=]/g, function(m) { return map[m]; });
}

this.getAllChatHistory = function() {
    pg.connect(connectionString, function(err, client, done) {
        var allChatQuery = "SELECT * " +
                           "FROM group_chats JOIN chat_messages " +
                              "USING (chat_id) " +
                           "ORDER BY message_time;";
        var chatToGroup = {};
        client.query(allChatQuery, function(err, result) {
            if(err) { return console.log(err); }
            for(var i = 0; i < result.rows.length; i++) {
                var group = result.rows[i].group_id;
                if(!groups[group]) 
                    createGroupData(group);
                groups[group].messages.push({user:result.rows[i].username,
                                             message:result.rows[i].message});
                groups[group].messageNo++;
            }
        });
    });
}
