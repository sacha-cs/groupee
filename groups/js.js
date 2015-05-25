/* To be called when the 'Create!' button is clicked in the Create page. */
function createGroup() {
    var groupname = document.getElementById("group_name").value;
    var description = document.getElementById("description").value;
    var e = document.getElementsByClassName("privacy-dropdown")[0];
    var privacy = e.options[e.selectedIndex].text;

    var aClient = new HttpClient();
    aClient.post('create', 'group_name=' + groupname + 
                           '&description=' + description + 
                           '&privacy=' + privacy,
        function (response) { /*TODO: Fill in error checking code.*/ }
    );
    console.log("Posted!");
}

function loaded() {

}
