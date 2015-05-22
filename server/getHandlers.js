var getHandlers = {
};

this.getHandler = function(uri) {
    return getHandlers[uri];
}

this.addHandler = function (uri, handler) {
    getHandlers[uri] = handler;
}

