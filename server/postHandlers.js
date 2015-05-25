var postHandlers = {
};

this.getHandler = function(uri) {
    return postHandlers[uri].handler;
}

this.addHandler = function(uri, handler, useOwn) {
    postHandlers[uri] = { handler:handler, useOwn:useOwn };
}

this.useOwn = function (uri) {
    console.log(postHandlers[uri].useOwn);
    return postHandlers[uri].useOwn;
}
