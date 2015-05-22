var chatRefreshRate = 100;

var lastMessageID;
var chatInterval;

function startChat() {
    aClient = new HttpClient();
    aClient.get("/last_chat_no",
    function(response) {
        lastMessageID = parseInt(response);
    });
    chatInterval = setInterval(updateChat, chatRefreshRate);

    document.getElementById('message').onkeypress = function(e) {
        var event = e || window.event;
        var charCode = event.which || event.keyCode;

        if ( charCode == '13' ) {
            sendMessage();
            return false;
        }
    }
}

function updateChat() {
    var chat = document.getElementById("chat");
    aClient = new HttpClient();
    aClient.get('chat_update?last='+lastMessageID, 
    function(response) {
        var res = response.split("#");
        var newID = parseInt(res[0]);
        if(newID > lastMessageID)
        {
            lastMessageID = newID;
            chat.innerHTML += res[1];
        }
    });
}

function sendMessage() {
    var chatBox = document.getElementById("message");
    var message = chatBox.value;
    if(!message)
        return;
    aClient = new HttpClient();
    aClient.post('send_message', "chatmessage="+message, 
    function (response) {
    });
    chatBox.value = "";
    chatBox.focus();
}

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

