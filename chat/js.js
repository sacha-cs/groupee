var chatRefreshRate = 1000;
var filePath = "http://natpat.net/groupee/";

var lastMessageID;
var oldTitle;
var tabOpen;
var lastSeenMessage;

var chatSound = new Audio('http://natpat.net/groupee/avatars/chat_sound.mp3');
var input;
var chatOpen = true;
var firstUpdate = true;

var inNotesPage = false;

function startChat() {
    if(getCookie("chatOpen") == "") {
        setCookie("chatOpen", "true");
    }
    if(getCookie("chatOpen") == "false") {
        setTransitions("0s");
        toggleChat();
        setTimeout( function() {
            setTransitions("0.5s");
        }, 500);
    }
    lastMessageID = 0;
    lastSeenMessage = 0;
    updateChat();

    oldTitle = document.title;
    
    resetChatBox();
    tabOpen = true;
    window.addEventListener("blur", function() { 
        tabOpen = false;
    });
    window.addEventListener("focus", function() { 
        tabOpen = true;
        document.title = oldTitle;
        if(chatOpen)
            lastSeenMessage = lastMessageID;
    });
}

function toggleChat() {

    chatOpen = !chatOpen;
    var cookieValue;
    if (chatOpen) {
        document.getElementById("content").style.left = "335px";
        document.getElementById("chat-left").style.left = "0px";
        document.getElementById("new-messages-icon").style.display = "none";
        cookieValue = "true";
    } else {
        document.getElementById("content").style.left = "50px";
        document.getElementById("chat-left").style.left = "-285px";     
        cookieValue = "false";
    }
 
    if (typeof chatHasToggled == "function") {
        chatHasToggled(chatOpen);
    }
    
    setCookie("chatOpen", cookieValue);
}

function updateChat() {
    var chat = document.getElementById("chat");
    aClient = new HttpClient();
    aClient.get('/chat/chat_update?last='+lastMessageID,
    function(response) {
        response = JSON.parse(response);
        var newID = response.newID;
        if (newID > lastMessageID)
        {
            lastMessageID = newID;
            var msgInfo = response.messages;
            addMessagesToChat(msgInfo);
            var newMessages = lastMessageID - lastSeenMessage;
            if(!tabOpen) {
                document.title = "(" + (newMessages) + ") " + oldTitle;
            } 
            if(!chatOpen && !firstUpdate) {
                var icon = document.getElementById("new-messages-icon");
                icon.style.display = "block";
                icon.innerHTML = newMessages;
            }
            if((!tabOpen || !chatOpen) && !firstUpdate) {
                chatSound.play();
            }
            if((tabOpen && chatOpen) || firstUpdate) {
                lastSeenMessage = lastMessageID;
            }
        }
        firstUpdate = false;
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
    var data = {
        chatmessage: message
    };
    aClient.post('/chat/send_message', JSON.stringify(data),
    function (response) {
    });
    chatBox.value = "";
}

function prefixWithZero(num) {
    return (num < 10) ? ("0" + num) : num;
}

function addMessagesToChat(messages) {
    var chat = document.getElementById("chat");
    var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;
    var messenger;
    var allHTML = "";
    var user;
    var message;
    for(var i = 0; i < messages.length; i++) {
        user = messages[i].user;
        message = messages[i].message;
        var time = messages[i].time;
        var d = new Date(time);
        var utc = d.getTime() + (d.getTimezoneOffset());
        var nd = new Date(utc);
        var hours = nd.getHours();
        var minutes = prefixWithZero(nd.getMinutes());
        var day = prefixWithZero(nd.getDate());
        var month = prefixWithZero(nd.getMonth() + 1);
        var year = nd.getFullYear()
        var tooltipDate = hours + ":" + minutes;
        var now = new Date()
        if (year != now.getFullYear()) {
            tooltipDate = day + "/" + month + "/" + year + " " + tooltipDate
        } else if (day != now.getDate() && month != now.getMonth()) {
            tooltipDate = day + "/" + month + " " + tooltipDate
        }
        
        if (getCookie("username") == user) {
            messenger = "self";
        } else {
            messenger = "other";
        }
        var htmlMsg = "<li class=\"" + messenger + "\">" + 
                            "<span class=\"avatar\" style='background-image:url(\"" + getAvatar(user) + "\")'>" +
                                "<span id=\"popover-avatar\">" + tooltipDate + "</span>" +
                            "</span>" +
                            "<span class=\"messages\">" +
                                "<p><b>" + user + ":</b> " + message + "</p>" +
                            "</span>" +
                        "</li>";

        allHTML += htmlMsg; 
    }

    chat.innerHTML += allHTML;

    if(isScrolledToBottom)
        chat.scrollTop = chat.scrollHeight - chat.clientHeight;
}

function resizeChatBox() {
    var chatBox = document.getElementById("chat-box");
    var chatMessages = document.getElementById("chat-messages");
    var height = (input.scrollHeight + 2);
    input.style.height = "0px";
    input.style.height = height + "px";
    chatBox.style.height = (height + 25) + "px";
    chatMessages.style.height = "calc(100% - " + (height + 75) + "px)";
}

function keyEntered(e) {
    var event = e || window.event;
    var charCode = event.which || event.keyCode;

    if ( charCode == '13' && !e.shiftKey) {
        sendMessage();
        e.preventDefault();
        resetChatBox();
        input.focus();
    }
}

function resetChatBox() {
    document.getElementById("chat-box").innerHTML = 
        "<textarea id='message'></textarea>";
    input = document.getElementById("message");
    input.onkeypress = keyEntered;
    input.oninput = resizeChatBox;
    resizeChatBox();
}

function setTransitions(time) {
    var chat = document.getElementById("chat-left");
    var content = document.getElementById("content");
    chat.style["-webkit-transition"] = "left " + time + " ease";
    chat.style["-moz-transition"] = "left " + time + " ease";
    chat.style["-o-transition"] = "left " + time + " ease";
    chat.style["transition"] = "left " + time + " ease";
    content.style["-webkit-transition"] = "left " + time + " ease";
    content.style["-moz-transition"] = "left " + time + " ease";
    content.style["-o-transition"] = "left " + time + " ease";
    content.style["transition"] = "left " + time + " ease";
}
