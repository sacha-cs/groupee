/* Loads the navigation bar with information about the current user and its group. */
function loaded() {
    var groupName = getCookie("group-name");
    var userName = getCookie("username");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    document.cookie="seshCookie=;path=/";
}
