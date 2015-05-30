var chatOpen = true;

function toggleChat() {

	chatOpen = !chatOpen;

	if (chatOpen) {
		document.getElementById("content").style.left = "300px";
		document.getElementById("chat-toggle").style.left = "285px";
	} else {
		document.getElementById("content").style.left = "15px";
		document.getElementById("chat-toggle").style.left = "0px";		
	}

}
function templateLoaded() {
    var groupName = getCookie("group-name");
    var userName = getCookie("username");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";

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
