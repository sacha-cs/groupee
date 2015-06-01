postHandler.addHandler("whiteboard/update", receivedUpdate, true);
getHandler.addHandler("whiteboard/getUpdate", sendUpdates);

var groups = {};
var TIMEOUT_TIME = 10*1000;
var currentToolIds = {};

function createGroupData(group) {
    groups[group] = { lastUpdateNo: 0,
                      updates: [],
                      waitingRequests: [] };
}

function receivedUpdate(request, response, payload)
{
    var seshCookie = utils.getSessionCookie(request);
    var group = utils.getViewingGroup(request);

    payload = JSON.parse(payload);

    if(payload.justStarted) {
        currentToolIds[seshCookie] = Math.floor(Math.random() * 100000);
    }

    payload.id = currentToolIds[seshCookie];
    payload.user = utils.getUser(request);
    groups[group].updates.push(payload);
    groups[group].lastUpdateNo++;
    utils.respondPlain(response, "");

    while(groups[group].waitingRequests.length > 0) {
        var curr = groups[group].waitingRequests[0];
        groups[group].waitingRequests.splice(0, 1);
        if(curr.timedOut)
            continue;
        clearTimeout(curr.timeoutID);
        curr.callback(curr.request, curr.response, curr.params);
    }
}

function sendUpdates(request, response, params, checkForNew)
{
    var group = utils.getViewingGroup(request);
    if(!groups[group])
        createGroupData(group);
    var last = parseInt(params.last);
    
    //If there are no more messages to send, add it to the waiting list 
    if(!params.allUpdates && !checkForNew && last == groups[group].lastUpdateNo)
    {
        var requestData = {"request":request,
                           "response":response,
                           "params":params,
                           "callback":sendUpdates,
                           "timedOut": false};
        var timeoutID = setTimeout(requestTimedOut, TIMEOUT_TIME, requestData);

        requestData.timeoutID = timeoutID;
        groups[group].waitingRequests.push(requestData);
        
        return;
    }
    
    response.writeHead(200, { "Content-Type": 'application/json' });
    resObj = {};
    resObj.lastUpdateNo = groups[group].lastUpdateNo;
    resObj.responses = [];
    while(last < groups[group].lastUpdateNo)
    {
        if((params.allUpdates == undefined) && groups[group].updates[last].user == utils.getUser(request)) {
            last++;
            continue;
        }
        resObj.responses.push(groups[group].updates[last]);
        last++;
    }
    response.end(JSON.stringify(resObj));
}

function requestTimedOut(requestData) {
    requestData.timedOut = true;
    sendUpdates(requestData.request, requestData.response, requestData.params,true);
}
