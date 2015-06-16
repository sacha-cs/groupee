function loaded() {
	var groupName = decodeURIComponent(getCookie("group-name"));
	document.getElementById("group-name").innerHTML = "<h1>" + groupName + "</h1>";
    getSpaceUsed();
}

function toggleUsersSettings() {
	document.getElementById("add-users").style.display = 'block';
	document.getElementById("quit-confirm").style.display = 'none';
    document.getElementById("rename-group").style.display = 'none';
}

function toggleQuitSettings() {
	document.getElementById("quit-confirm").style.display = 'block';
	document.getElementById("add-users").style.display = 'none';
    document.getElementById("rename-group").style.display = 'none';
}

function toggleRenameSettings() {
    document.getElementById("rename-group").style.display = 'block';
    document.getElementById("add-users").style.display = 'none';
    document.getElementById("quit-confirm").style.display = 'none';
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
                setErrorText("Sorry, you aren't able to join this group.");
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

function renameGroup() {
    var groupName = document.getElementById("group-new-name").value;

    var aClient = new HttpClient();
    aClient.post('rename_group', "groupName=" + groupName, function(response) {});
    groupName = encodeURIComponent(escapeHtml(groupName));
    document.cookie = "group-name=" + groupName + ";path=/";
    location.reload(true);
}

function getSpaceUsed() {
    var aClient = new HttpClient();
    aClient.get('get_space_used', function(response) {
        var spaceUsed = bytesToSize(response, 2);
        document.getElementById("space-used").innerHTML = "Storage space used: " + spaceUsed;
    })
}


function bytesToSize(bytes, precision) {  
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
   
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
 
    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
 
    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
 
    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
 
    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
 
    } else {
        return bytes + ' B';
    }
}
