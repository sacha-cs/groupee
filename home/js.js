function loaded() {
    var groupName = getCookie("group-name");
    var userName = getCookie("username");
    var groupText = document.getElementById("navbar-group");
    var userText = document.getElementById("navbar-self");
    groupText.innerHTML = "<p>" + groupName + "</p>";
    userText.innerHTML = "<p>Welcome, " + userName + "!</p>";
}
