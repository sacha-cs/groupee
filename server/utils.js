
this.respondPlain = function (response, text) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(text);
}

this.getUser = function(request) {
    var cookie = request.headers.cookie;
    if(!cookie) return;
    var cookies = this.splitParams(cookie, ';');
    var seshCookie = cookies.seshCookie;
    if(!seshCookie) return;
    var user = sessionKeys[seshCookie];
    return user;
}

this.splitParams = function(string, splitOn) {
    if(!splitOn)
        splitOn = '&';
    var params = {};
    if(string == null || string == undefined) return params;
    var parts = string.split(splitOn);
    for (var i = 0; i < parts.length; i++) {
        var param = parts[i];
        var keyAndValue = param.split("=");
        params[keyAndValue[0].trim()] = keyAndValue[1].trim();
    }
    return params;
}
