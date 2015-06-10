var postHandlers = {
};

this.getHandler = function(uri) {
    if(!postHandlers[uri])
        return null;
    return postHandlers[uri].handler;
}

this.addHandler = function(uri, handler, useOwn, options) {
    postHandlers[uri] = { handler:handler, useOwn:useOwn, options:options };
}

this.useOwn = function (uri) {
    if(!postHandlers[uri])
        return null;
    return postHandlers[uri].useOwn;
}

this.getOptions = function (uri) {
    if(!postHandlers[uri])
        return null;
    return postHandlers[uri].options;
}
