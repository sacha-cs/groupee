var waitingForResponse = false;

/* To be called when the 'Create!' button is clicked in the Create page. */
function createGroup() {
    if (waitingForResponse) {
        return;
    }
    waitingForResponse = true;
    var groupname = document.getElementById("group_name").value;
    var description = document.getElementById("description").value;
    var e = document.getElementsByClassName("privacy-dropdown")[0];
    var privacy = e.options[e.selectedIndex].text;

    var aClient = new HttpClient();
    aClient.post('create', 'group_name=' + groupname + 
                           '&description=' + description + 
                           '&privacy=' + privacy,
        function (response) { 
            var correct = response[0];
            if(correct == "N") {
                waitingForResponse = false;
                switch(response.slice(1)) {
                    case "NUserExistsInGroup":
                        setErrorText("You are already a member of this group.");
                        break;
                }
            } else { // No problems.
               window.location = "add_people.html"; 
            } 
        }
    );
}

function loaded() {

}
