postHandler.addHandler("whiteboard/update", receivedUpdate, true);
getHandler.addHandler("whiteboard/getUpdate", sendUpdates);

var TIMEOUT_TIME = 10*1000;
var updates = [];
var lastUpdateNo = 0;
var waitingRequests = [];
var currentToolIds = {};

function receivedUpdate(request, response, payload)
{
    var seshCookie = utils.getSessionCookie(request);
    payload = JSON.parse(payload);

    if(payload.justStarted) {
        currentToolIds[seshCookie] = Math.floor(Math.random() * 100000);
    }

    payload.id = currentToolIds[seshCookie];
    payload.user = utils.getUser(request);
    updates.push(payload);
    lastUpdateNo++;
    utils.respondPlain(response, "");

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
    
    response.writeHead(200, { "Content-Type": 'application/json' });
    resObj = {};
    resObj.lastUpdateNo = lastUpdateNo;
    resObj.responses = [];
    while(last < lastUpdateNo)
    {
        if((params.allUpdates == undefined) && updates[last].user == utils.getUser(request)) {
            last++;
            continue;
        }
        resObj.responses.push(updates[last]);
        last++;
    }
    response.end(JSON.stringify(resObj));
}

function requestTimedOut(requestData) {
    requestData.timedOut = true;
    sendUpdates(requestData.request, requestData.response, requestData.params,true);
}
