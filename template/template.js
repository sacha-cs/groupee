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
