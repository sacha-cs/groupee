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
                window.location = "add_users.html"; 
            } 
        }
    );
}

function loaded() {

}

/* Adds a user to an existing group. */
function addUser() {

}

