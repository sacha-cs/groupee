var postHandlers = {
};

this.getHandler = function(uri) {
    if(!postHandlers[uri])
        return null;
    return postHandlers[uri].handler;
}

this.addHandler = function(uri, handler, useOwn) {
    postHandlers[uri] = { handler:handler, useOwn:useOwn };
}

this.useOwn = function (uri) {
    if(!postHandlers[uri])
        return null;
    return postHandlers[uri].useOwn;
}
