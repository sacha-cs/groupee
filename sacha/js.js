function login()
{
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
   
    console.log("u: " + username + ", p: "+password);
    if(username == "" || password == "")
    {
        document.getElementById("error").innerHTML = "Please fill out all fields.";
    }

    aClient = new HttpClient();
    aClient.post('login', 'username=' + username + 
                         '&password=' + password, 
    function (response) {
        console.log(response);
    });
}
