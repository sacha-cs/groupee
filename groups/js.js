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

    setErrorText("");
    setSuccessText("");

    if (username == "") {
        setErrorText("Please enter a username");
        return;
    }

    var aClient = new HttpClient();
    aClient.post('add', 'username=' + username, 
        function (response) {
            var correct = response[0];
            if (correct == "N") {
                switch(response.slice(1)) {
                    case "UserExistsInGroup":
                        setErrorText("The user is already a member of this group.");
                        break;
                    case "UserDoesNotExist":
                        setErrorText("The user does not exist");
                        break;
                }
            } else {
                document.getElementById("username").value = "";
                setSuccessText("User added successfully");
            }
        }
    );
}

