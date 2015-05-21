var localUrl = "http://146.169.46.253";
var chatRefreshRate = 1000;

var lastMessageID;
var chatInterval;

function startChat() {
    aClient = new HttpClient();
    aClient.get(localUrl + "/last_chat_no",
    function(response) {
        lastMessageID = parseInt(response);
    }
    chatInterval = setInterval(updateChat, chatRefreshRate)
}

function updateChat() {
    var chat = document.getElementById("chat");
    aClient = new HttpClient();
    /*aClient.get('http://146.169.46.253/chat_update?last='+lastMessageID, 
    function(response) {
        var res = response.split("#");
        var newID = parseInt(res[0]);
        if(newID > lastMessageID)
        {
            lastMessageID = newID;
            chat.innerHTML += res[1];
        }
    });*/
}

function sendMessage() {
    var chatBox = document.getElementById("message");
    var message = chatBox.value;
    chatBox.value = "";
    if(!message)
        return;
    aClient = new HttpClient();
    aClient.post('http://146.169.46.253/send_message', "chatmessage="+message, 
    function (response) {
    });
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
        console.log(params);
        http.send(params);
    }
}

