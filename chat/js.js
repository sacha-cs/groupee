var chatRefreshRate = 1000;
var filePath = "http://www.doc.ic.ac.uk/project/2014/271/g1427136/";

var lastMessageID;
var oldTitle;
var tabOpen;
var lastSeenMessage;

var chatSound = new Audio('http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/chat_sound.mp3');

function startChat() {
    lastMessageID = 0;
    updateChat();

    document.getElementById('message').onkeypress = function(e) {
        var event = e || window.event;
        var charCode = event.which || event.keyCode;

        if ( charCode == '13' ) {
            sendMessage();
            return false;
        }
    }
    oldTitle = document.title;
    tabOpen = true;

    window.addEventListener("blur", function() { 
        tabOpen = false;
        lastSeenMessage = lastMessageID;
    });
    window.addEventListener("focus", function() { 
        tabOpen = true;
        document.title = oldTitle;
        lastSeenMessage = lastMessageID;
    });
}

function updateChat() {
    var chat = document.getElementById("chat");
    aClient = new HttpClient();
    var d = new Date();
    aClient.get('/chat/chat_update?last='+lastMessageID + "&time=" + d.getMinutes() + ":" + d.getSeconds(),
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
                addMessageToChat(user, decodeURIComponent(textMsg));
            }
            if(!tabOpen) {
                document.title = "(" + (lastMessageID - lastSeenMessage) +
                                 ") " + oldTitle;
                chatSound.play();
            }
        }
        updateChat();
    });
}

function sendMessage() {
    var chatBox = document.getElementById("message");
    var message = chatBox.value;
    if(!message)
        return;

    aClient = new HttpClient();
    var d = new Date();
    aClient.post('/chat/send_message', "chatmessage="+ encodeURIComponent(message) + "&time=" + d.getMinutes() + ":" + d.getSeconds(),
    function (response) {
    });
    chatBox.value = "";
    chatBox.focus();
}

function addMessageToChat(user, message) {
    var chat = document.getElementById("chat");
    var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;
    var messenger;
    if (getCookie("username") == user) {
        messenger = "self";
    } else {
        messenger = "other";
    }

    var htmlMsg = "<li class=\"" + messenger + "\">" + 
                        "<span class=\"avatar\">" +
                            "<img class=\"avatarimage\" src='" + filePath + "avatars/" + user + ".png'/>" +
                        "</span>" +
                        "<span class=\"messages\">" +
                            "<p><u>" + user + ":</u> " + message + "</p>" +
                        "</span>" +
                    "</li>";

    chat.innerHTML += htmlMsg;    

    if(isScrolledToBottom)
        chat.scrollTop = chat.scrollHeight - chat.clientHeight;
}
