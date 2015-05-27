
var HttpClient = function(ensureSent) {
    if(ensureSent !== true)
        ensureSent = false;

    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }
        
        console.log("Before get " + !ensureSent);
        anHttpRequest.open( "GET", aUrl, !ensureSent );            
        anHttpRequest.send( null );
    }
    this.post = function(aUrl, params, aCallback) {
        var http = new XMLHttpRequest();
        console.log("Before post " + !ensureSent);
        http.open("POST", aUrl, !ensureSent);            
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() { 
            if (http.readyState == 4 && http.status == 200)
                aCallback(http.responseText);
        }
        http.send(params);
    }
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
