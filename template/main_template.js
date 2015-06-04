function templateLoaded() {
    var groupName = getCookie("group-name");
    var userName = getCookie("username");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    var avatarImage = document.getElementById("avatar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
    avatarImage.innerHTML += "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" + userName + ".png'>"

	document.getElementById("chat").addEventListener("mousewheel", function (e) {
	    var delta = e.wheelDelta || -e.detail;
	    
	    this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
	    e.preventDefault();
	});
	document.getElementById("chat").addEventListener("DOMMouseScroll", function (e) {
	    var delta = e.wheelDelta || -e.detail;
	    
	    this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
	    e.preventDefault();
	});

	loaded();
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    document.cookie="seshCookie=;path=/";
}

function goTo(page) {
	window.location = "/" + page;
}
