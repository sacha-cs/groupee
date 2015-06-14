/* To be called when the 'Create!' button is clicked in the Create page. */
function createGroup() {
    var groupname = document.getElementById("group_name").value;
    var description = document.getElementById("description").value;
    var e = document.getElementsByClassName("privacy-dropdown")[0];
    var privacy = e.options[e.selectedIndex].text;

    setErrorText("");
    if(groupname == "" || description == "" || e.selectedIndex == 0)
    {
        setErrorText("Please fill out all fields.");
        return;
    }

    var payload = {
        group_name: groupname,
        description: description,
        privacy: privacy
    }
    var aClient = new HttpClient();
    aClient.post('create', JSON.stringify(payload),
        function (response) { 
            response = JSON.parse(response);
            if(response.success) {
                window.location = "add_users.html"; 
            } else { // No problems.
                setErrorText(response.error);
            } 
        }
    );
}


/* To be called when the 'Add!' button is clicked in the Add Users page. */
function addUser() {
    var username = document.getElementById("username").value;

    setErrorText("");
    setSuccessText("");

    if (username == "") {
        setErrorText("Please enter a username");
        return;
    }

    var aClient = new HttpClient();
    aClient.post('add', 'username=' + username, 
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

/* Function to add the groups that the current user is a member of to the index page. */
function addGroupsToPage() {
    var groups = document.getElementById("groups");
    var aClient = new HttpClient();

    /* Obtain a response from the server containing the group names corresponding to the user
       along with their descriptions. */
    aClient.get('/groups/get_all_groups',
        function(response) {
            response = JSON.parse(response);
            var allGroupHTML = "";
            for(var i = 0; i < response.groups.length; i++) {
                info = response.groups[i];
                info.desc = escapeHtml(info.desc);

    
                var avatars = "";
                info.members.map(function(item) {
                    avatars += "<span class='group-avatar'>" +
                               "<div style='background-image:url(\"" + getAvatar(item) + "\")' class='avatar-img'></div>" + 
                               "<div class='popover-avatar'>" + item + "</div>"+
                               "</span>"
                });

                /* Crate a HTML element with containing the above information. */
                /* When one clicks on a group, remember the group's id and move to Home. */
                var groupHtml = '<div onclick="setGroup(' + info.id + ')" class="groupButton">' +
                    '<div id="group"> ' + 
                       '<div class="group-name">' + info.name + '</div>' +
                       '<div class="group-description">' + info.desc + '</div>' +
                       '<span class="group-avatars">' + avatars + '</span>' +
                    '</div>' +
                '</div>';
                
                allGroupHTML += groupHtml;
            }
            groups.innerHTML = allGroupHTML;
            document.getElementById("create-group").style.display = "block";
            document.getElementById("loading").style.display = "none";
        }
    );
}

function setGroup(groupId) {
    var aClient = new HttpClient();
    aClient.get('/groups/set_viewing_group?group_id=' + groupId, function(response) {
        response = JSON.parse(response);
        if(response.success) { 
            /* Get the groupName from the response. */
            var groupName = encodeURIComponent(escapeHtml(response.name));
            document.cookie = "group-name=" + groupName + ";path=/";
            window.location = "/home/";
        }
    });
}

// Joins the current user to the group with name "groupname".
function joinSpecificGroup(groupname) {
    var aClient = new HttpClient();

    setErrorText("");
    setSuccessText("");

    aClient.post('/groups/join', 'groupname=' + groupname, function(response) {
        response = JSON.parse(response);
        var decodedName = "<a class='redir-group' href='#' onclick='setGroup(" + response.groupId + ")'>" + decodeURIComponent(groupname) + "</a>";
        if (response.success) {
            // All is well. 
            document.getElementById("group_name").value = "";
            if (response.userAlreadyInGroup) {
                setErrorText("You are already a member of " + decodedName);
            } else {
                setSuccessText("Welcome to " + decodedName + ", " + getCookie("username") + "!");
            }
        } else {
            // Something went wrong.
            setErrorText("Sorry, we weren't able to add you to " + decodeURIComponent(groupname));
        }
    });
}

// Occurs after the user types a group name in the "Join a group" page and clicks "Join!".
function joinGroup() {
    var groupname = document.getElementById("group_name").value;
    
    setErrorText("");
    setSuccessText("");

    if (groupname == "") {
        setErrorText("Please enter a group name");
        return;
    }
    
    joinSpecificGroup(groupname);
}

function setTextField(text) {
    var decodedText = decodeURIComponent(text);
    document.getElementById("group_name").value = decodedText;
    joinSpecificGroup(text);
}

// Populate autocomplete div with suggestions.
function populateAutocompleter(suggestions) {
    var suggestionsHtml = "";
    var groupsFound = document.getElementById('autocompleter');
    groupsFound.style.height = '250px';
    groupsFound.style.overflowY = 'auto';
    groupsFound.style.overflowX = 'hidden';
     
    for (var i = 0; i < suggestions.length; i++) {
        var suggestion = encodeURIComponent(suggestions[i]);
        suggestionsHtml += "<div onclick=setTextField('" + suggestion + "')><a href='#' class='suggestion'>" + decodeURIComponent(suggestion) + "</a></div><br>";
    }
    document.getElementById("autocompleter").innerHTML = suggestionsHtml;
}

function autoComplete() {
    var text = document.getElementById("group_name").value;
    
    if (text.replace(/\s/g, '').length) {
        var aClient = new HttpClient();
        aClient.get('/groups/autocomplete?text=' + text, function(response) {
            response = JSON.parse(response);
            if (response.success) {
                populateAutocompleter(response.suggestions);
            } else {
                // I'd rather not show anything.
                document.getElementById("autocompleter").value = "";        
            }     
        });
    }
}

function loaded() {
    addGroupsToPage();
}
