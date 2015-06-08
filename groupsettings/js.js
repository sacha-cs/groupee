function loaded() {
	var groupName = decodeURIComponent(getCookie("group-name"));
	document.getElementById("group-name").innerHTML = "<h1>" + groupName + "</h1>";
}

function toggleUsersSettings() {
	document.getElementById("add-users").style.display = 'block';
	document.getElementById("quit-confirm").style.display = 'none';
}

function toggleQuitSettings() {
	document.getElementById("quit-confirm").style.display = 'block';
	document.getElementById("add-users").style.display = 'none';

}

function addUser() {
    var username = document.getElementById("username").value;

    setErrorText("");
    setSuccessText("");

    if (username == "") {
        setErrorText("Please enter a username");
        return;
    }

    var aClient = new HttpClient();
    aClient.post('/groups/add', 'username=' + username, 
        function (response) {
            response = JSON.parse(response);
            if (!response.success) {
                setErrorText(response.error);
            } else {
                document.getElementById("username").value = "";
                setSuccessText("User added successfully");
            }
        }
    );
}

function quitGroup() {
	var username = getCookie("username");

	var aClient = new HttpClient();
	aClient.post('quit_group', 'username=' + username, 
		function(response) {});

	window.location = '/groups/';
}
