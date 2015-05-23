var chatRefreshRate = 1000;
var filePath = "http://www.doc.ic.ac.uk/project/2014/271/g1427136/";

var lastMessageID;
var chatInterval;

function startChat() {
    aClient = new HttpClient();
    aClient.get("last_chat_no",
    function(response) {
        lastMessageID = parseInt(response);
        chatInterval = setInterval(updateChat, chatRefreshRate);
    });

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
        var msgInfo = res[1].split("\n");
        if (newID > lastMessageID)
        {
            lastMessageID = newID;
            for (i = 0; i < msgInfo.length -1; i++) {
                var currMsg = msgInfo[i].split(";");
                var user = currMsg[0].split("=")[1];
                var textMsg = currMsg[1].split("=")[1];
                var htmlMsg = "<img src='" + filePath + "avatars/" + user + ".png' width=100 height=100/>" + user + ": " + textMsg + "<br />";  
                chat.innerHTML += htmlMsg;    
            }
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


