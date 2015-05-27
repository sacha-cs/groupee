function loaded() {
    var groupName = getCookie("group-name");
    var groupText = document.getElementById("navbar-group");
    groupText.innerHTML = "<p>" + groupName + "</p>";
}
