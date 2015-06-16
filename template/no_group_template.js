function templateLoaded() {
    var userName = getCookie("username");
    var userText = document.getElementById("navbar-self");
    var avatarImage = document.getElementById("avatar-self");
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
    avatarImage.style["background-image"] = "url(" + getAvatar(userName) + ")";

	loaded();
    startNotifications();
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    var client = new HttpClient(true);
    client.get("/login/logout", function() {
        document.cookie="seshCookie=;path=/";
    });
}

