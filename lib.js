
var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
    this.post = function(aUrl, params, aCallback) {
        var http = new XMLHttpRequest();
        http.open("POST", aUrl, true);            
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() { 
            if (http.readyState == 4 && http.status == 200)
                aCallback(http.responseText);
        }
        http.send(params);
    }
}
