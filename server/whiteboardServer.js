postHandler.addHandler("whiteboard/update", receivedUpdate, true);
getHandler.addHandler("whiteboard/getUpdate", sendUpdates);

var TIMEOUT_TIME = 10*1000;
var updates = [];
var lastUpdateNo = 0;
var waitingRequests = [];
var currentToolIds = {};

function receivedUpdate(request, response, params)
{
    var seshCookie = utils.getSessionCookie(request)
    if(params.justStarted == "true") {
        currentToolIds[seshCookie] = Math.floor(Math.random() * 100000);
    }
    var lastUpdate = false;
    if(params.lastUpdate)
        lastUpdate = true;

    updates.push({data:params.data, user:utils.getUser(request), id:currentToolIds[seshCookie], lastUpdate:lastUpdate});
    lastUpdateNo++;
    utils.respondPlain(response, "");
    console.log(params.data);
    console.log("??:" + params.lastUpdate);


    while(waitingRequests.length > 0) {
        var curr = waitingRequests[0];
        waitingRequests.splice(0, 1);
        if(curr.timedOut)
            continue;
        clearTimeout(curr.timeoutID);
        curr.callback(curr.request, curr.response, curr.params);
    }
}

function sendUpdates(request, response, params, checkForNew)
{
    var last = parseInt(params.last);
    
    //If there are no more messages to send, add it to the waiting list 
    if(!params.allUpdates && !checkForNew && last == lastUpdateNo)
    {
        var requestData = {"request":request,
                           "response":response,
                           "params":params,
                           "callback":sendUpdates,
                           "timedOut": false};
        var timeoutID = setTimeout(requestTimedOut, TIMEOUT_TIME, requestData);

        requestData.timeoutID = timeoutID;
        waitingRequests.push(requestData);
        
        return;
    }
    
    response.writeHead(200, { "Content-Type": 'text/plain' });
    response.write(lastUpdateNo + "<>");
    while(last < lastUpdateNo)
    {
        console.log("update.");
        console.log(params.allUpdates);
        console.log(params.allUpdates == undefined);
        if((params.allUpdates == undefined) && updates[last].user == utils.getUser(request)) {
            console.log(updates[last].user)
            console.log(utils.getUser(request));
            last++;
            console.log("NOT sending...");
            continue;
        }
        response.write("id-" + updates[last].id + "@" + "lastUpdate-" + updates[last].lastUpdate + "@" + updates[last].data + "\\");
        console.log("id-" + updates[last].id + "@" + "lastUpdate-" + updates[last].lastUpdate + "@" + updates[last].data + "\\");
        last++;
    }
    if(params.allUpdates) 
        response.write("<>true");
    response.end();
}

function requestTimedOut(requestData) {
    requestData.timedOut = true;
    sendUpdates(requestData.request, requestData.response, requestData.params,true);
}
