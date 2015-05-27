
this.respondPlain = function (response, text) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(text);
}

this.getUser = function(request) {
    //Yes, there is a cookie that has the client's username, but rule #1:
    //NEVER TRUST THE USER. The user can't fake the session cookie, they can
    //fake the username cookie!!
    var seshCookie = this.getSessionCookie(request);
    if(seshCookie && sessionKeys[seshCookie]) {
        return sessionKeys[seshCookie].username;
    }
}

this.getViewingGroup = function(request) {
    var seshCookie = this.getSessionCookie(request);
    if(seshCookie && sessionKeys[seshCookie]) {
        return sessionKeys[seshCookie].groupViewing;
    }
}

/* Store the group that the user is currently viewing in the cookie. */
this.setViewingGroup = function(request, groupId) {
    var seshCookie = this.getSessionCookie(request);
    if(seshCookie && sessionKeys[seshCookie]) {
        sessionKeys[seshCookie].groupViewing = groupId;
    }
}

this.getSessionCookie = function(request) {
    var cookie = request.headers.cookie;
    if(!cookie) return;
    var cookies = this.splitParams(cookie, ';');
    var seshCookie = cookies.seshCookie;
    return seshCookie;
}

this.splitParams = function(string, splitOn) {
    var params = {};
    if(string == null || string == undefined) return params;
    
    if(!splitOn)
        splitOn = '&';
    
    var parts = string.split(splitOn);
    for (var i = 0; i < parts.length; i++) {
        var param = parts[i];
        var keyAndValue = param.split("=");
        params[keyAndValue[0].trim()] = keyAndValue[1].trim();
    }
    return params;
}
