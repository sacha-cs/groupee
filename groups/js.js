/* To be called when the 'Create!' button is clicked in the Create page. */
function createGroup() {
    var groupname = document.getElementById("group_name").value;
    var description = document.getElementById("description").value;
    //TODO: Get privacy level.

    var aClient = new HttpClient();
    aClient.post('create', 'group_name=' + groupname + 
                         '&description=' + description, 
        function (response) { /*TODO: Fill in error checking code.*/ }
    );
    console.log("Posted!");
}

function loaded() {

}
