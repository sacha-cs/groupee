var chatRefreshRate = 1000;
var filePath = "http://www.doc.ic.ac.uk/project/2014/271/g1427136/";

var lastMessageID;
var chatInterval;
var needUpdate;

function startChat() {
    aClient = new HttpClient();
    aClient.get("/chat/last_chat_no",
    function(response) {
        lastMessageID = parseInt(response);
        needUpdate = true;
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
    if(!needUpdate)
        return;

    needUpdate = false;
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
        }
        needUpdate = true;
    });
}

function sendMessage() {
    var chatBox = document.getElementById("message");
    var message = chatBox.value;
    if(!message)
        return;
    

    addMessageToChat(getCookie("username"), escapeHtml(message));


    aClient = new HttpClient();
    var d = new Date();
    aClient.post('/chat/send_message', "chatmessage="+message + "&time=" + d.getMinutes() + ":" + d.getSeconds(),
    function (response) {
    });
    chatBox.value = "";
    chatBox.focus();
}

function addMessageToChat(user, message) {
    var htmlMsg = "<img src='" + filePath + "avatars/" + user + ".png' width=100 height=100/>" + user + ": " + message + "<br />";  
    chat.innerHTML += htmlMsg;    
}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
