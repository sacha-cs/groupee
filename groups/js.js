/* To be called when the 'Create!' button is clicked in the Create page. */
function createGroup() {
    var groupname = document.getElementById("group_name").value;
    var description = document.getElementById("description").value;
    var e = document.getElementsByClassName("privacy-dropdown")[0];
    var privacy = e.options[e.selectedIndex].text;

    setErrorText("");
    if(groupname == "" || description == "")
    {
        setErrorText("Please fill out all fields.");
        return;
    }

    var aClient = new HttpClient();
    aClient.post('create', 'group_name=' + groupname + 
                           '&description=' + description + 
                           '&privacy=' + privacy,
        function (response) { 
            var correct = response[0];
            if(correct == "N") {
                switch(response.slice(1)) {
                    case "UserExistsInGroup":
                        setErrorText("You are already a member of this group.");
                        break;
                    case "EmptyFields":
                        setErrorText("Please fill out all the fields.");
                        break;
                }
            } else { // No problems.
               window.location = "add_users?group_id=" + response.slice(1); 
            } 
        }
    );
}


/* To be called when the 'Add!' button is clicked in the Add Users page. */
function addUser() {
    var username = document.getElementById("username").value;

    var aClient = new HttpClient();
    // TODO
}

/* Function to add the groups that the current user is a member of to the index page. */
function addGroupsToPage() {
    var groups = document.getElementById("groups");
    var aClient = new HttpClient();

    /* Obtain a response from the server containing the group names corresponding to the user
       along with their descriptions. */
    aClient.get('/groups/get_all_groups',
        function(response) {
            var groupInfoList = response.split("#");
            for(var i = 0; i < groupInfoList.length-1; i++) {
                var part = groupInfoList[i].split("&");
                console.log(part);
                var nameInfo = part[0];
                var descInfo = part[1];
                var idInfo = part[2];
                var info = {name : nameInfo.split("=")[1],  
                            description : escapeHtml(decodeURIComponent(descInfo.split("=")[1])),   
                            id : idInfo.split("=")[1] 
                }; 
                var groupHtml = '<a href="#">' +
		            '<div id="group"> ' + 
		               '<div class="group-name">' + info.name + '</div>' +
		               '<div class="group-description">' + info.description + '</div>' +
		            '</div>' +
	            '</a>';
                
                groups.innerHTML += groupHtml;
            }  
        }
    );
}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        "=": '&#061;'
    };

    return text.replace(/[&<>"'=]/g, function(m) { return map[m]; });
}
