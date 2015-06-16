function templateLoaded() {
	if (window.location.pathname != '/home/') {
		document.getElementById('shortcuts-icon').style.display = 'initial';
	}

    var groupName = decodeURIComponent(getCookie("group-name"));
    var userName = getCookie("username");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    var avatarImage = document.getElementById("avatar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
    avatarImage.style["background-image"] = "url(" + getAvatar(userName) + ")";

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
    getNotifications();
}

/* Log out the current user, and clear the session cookie. */
function logout() { 
    var client = new HttpClient(true);
    client.get("/login/logout", function() {
        document.cookie="seshCookie=;path=/";
    });
}

function goTo(page) {
	window.location = "/" + page;
}

function showShortcuts() {
	document.getElementById('popover-shortcuts').style.visibility = 'visible';
}

function hideShortcuts() {
	document.getElementById('popover-shortcuts').style.visibility = 'hidden';
}
