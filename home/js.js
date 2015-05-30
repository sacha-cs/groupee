/* Loads the navigation bar with information about the current user and its group. */
function loaded() {
    var groupName = getCookie("group-name");
    var userName = getCookie("username");
    var avatarImage = document.getElementById("avatar-self");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
    avatarImage.innerHTML = "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" + userName + ".png'>"
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    document.cookie="seshCookie=;path=/";
}

function goTo(page) {
	window.location = "/" + page;
}
