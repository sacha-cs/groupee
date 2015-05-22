function login()
{
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
   
    if(username == "" || password == "")
    {
        setErrorText("Please fill out all fields.");
        return;
    }

    aClient = new HttpClient();
    aClient.post('login', 'username=' + username + 
                         '&password=' + password, 
    function (response) {
        var correct = response[0];
        if(correct == "Y") {
            document.cookie="seshCookie="+response.slice(1) + ";path=/";
            console.log("seshCookie = " + response.slice(1));
            window.location = "/chat/";
        } else {
            switch(response.slice(1)) {
                case "IncorrectPassword":
                    setErrorText("Incorrect Password.");
                    break;
                 case "NoUser":
                    setErrorText("No User with that Username.");
                    break;
                 case "EmptyFields":
                    setErrorText("Please fill out all the fields.");
                    break;
            }
        }
                    
    });
}

function setErrorText(error) {

    document.getElementById("error").innerHTML = error;
    return;
}
