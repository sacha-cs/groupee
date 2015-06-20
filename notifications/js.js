var grammar = {
    "chat": "in a chat message",
    "posts": "in a post",
    "todos": "in a to-do",
    "calendar": "in an event",
    "photos": "in a comment"
}

function startNotifications() {
    var client = new HttpClient();
    client.get("/notifications/get_some?number=5", function(response) {
        response = JSON.parse(response);
        for(var i = 0; i < response.notifications.length; i++) {
            addNotification(response.notifications[i]);
        }
    });
    getNotifications();
}

function getNotifications() {
    var client = new HttpClient();
    client.get("/notifications/get_new", function(response) {
        response = JSON.parse(response);
        if(response.success) {
            addNotification(response);
            document.getElementById("new-notification").style.visibility="visible";
        }
        getNotifications();
    });
}

function addNotification(notif) {
    var notifications = document.getElementById("notifications");
    var newNotif = "<div class='notification' onclick='notifGoTo(" +
                    notif.groupId + ", \"" + notif.feature + "\")'>" +
                   "<span class='notif-message'>" + 
                   notif.fromUser + " mentioned you " + 
                   grammar[notif.feature] + " in '" +
                   notif.group + "'." +
                   "</span><div style='background-image:url(\"" + getAvatar(notif.fromUser) + "\")" +
                   "' class='notif-avatar'></div></div>";
    var old = notifications.innerHTML;
    notifications.innerHTML = newNotif.concat(old);
}


document.addEventListener("click", function() {
    document.getElementById("notifications").style.visibility="hidden";
});

function showNotifications(e) {
    e.stopPropagation();
    document.getElementById("notifications").style.visibility="visible";
    document.getElementById("new-notification").style.visibility="hidden";
}

function notifGoTo(group, feature) {
    var aClient = new HttpClient();
    aClient.get('/groups/set_viewing_group?group_id=' + group, function(response) {
        response = JSON.parse(response);
        if(response.success) { 
            /* Get the groupName from the response. */
            var groupName = encodeURIComponent(escapeHtml(response.name));
            document.cookie = "group-name=" + groupName + ";path=/";
            var goingTo = (feature == "chat" ? "home" : feature);
            window.location = "/" + goingTo + "/";
        }
    });
}

