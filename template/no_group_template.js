function templateLoaded() {
    var userName = getCookie("username");
    var userText = document.getElementById("navbar-self");
    var avatarImage = document.getElementById("avatar-self");
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
    avatarImage.innerHTML += "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" + userName + ".png'>"

	loaded();
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    document.cookie="seshCookie=;path=/";
}

