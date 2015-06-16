var grammar = {
    "chat": "in a chat message",
    "posts": "in a post",
    "to-dos": "in a to-do",
    "calendar": "in an event",
    "photos": "in a comment"
}

function getNotifications() {
    var client = new HttpClient();
    client.get("/notifications/get_new", function(response) {
        response = JSON.parse(response);
        if(response.success) {
            var notifications = document.getElementById("notifications");
            var newNotif = "<div class='notification'>" +
                           "<span class='notif-message'>" + 
                           response.fromUser + " mentioned you " + 
                           grammar[response.feature] + " in '" +
                           response.group + "'." +
                           "</span><div style='background-image:url(\"" + getAvatar(response.fromUser) + "\")" +
                           "' class='notif-avatar'></div></div>";
            var old = notifications.innerHTML;
            notifications.innerHTML = newNotif.concat(old);
            document.getElementById("new-notification").style.visibility="visible";
        }
        getNotifications();
    });
}

document.addEventListener("click", function() {
    document.getElementById("notifications").style.visibility="hidden";
});

function showNotifications(e) {
    e.stopPropagation();
    document.getElementById("notifications").style.visibility="visible";
    document.getElementById("new-notification").style.visibility="hidden";
}
