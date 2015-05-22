var postHandlers = {
};

this.getHandler = function(uri) {
    return postHandlers[uri];
}

this.addHandler = function(uri, handler) {
    postHandlers[uri] = handler;
}

