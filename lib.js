
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

function setErrorText(error) {

    document.getElementById("error").innerHTML = error;
    return;
}

function setSuccessText(success) {

    document.getElementById("success").innerHTML = success;
    return;
}


function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        "=": '&#061;'
    };

    return text.replace(/[&<>"'=]/g, function(m) { return map[m]; });
}
