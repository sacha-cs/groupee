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

function register()
{
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var passwordconfirm = document.getElementById("passwordconfirm").value;

    if(username == "" || password == "" || passwordconfirm == "")
    {
        setErrorText("Please fill out all fields.");
        return;
    }

    if(password != passwordconfirm)
    {
        setErrorText("Passwords do not match");
        return;
    }

    aClient = new HttpClient();
    aClient.post('register', 'username=' + username + 
                         '&password=' + password +
                         '&passwordconfirm=' + passwordconfirm, 
    function (response) {
        var correct = response[0];
        if(correct == "Y") {
            window.location = "/login/";
        } else {
            switch(response.slice(1)) {
                case "UsernameTaken":
                    setErrorText("Username is already taken")
                    break;
                case "UnknownError":
                    setErrorText("Something went wrong...");
                    break;
                 case "PasswordsDifferent":
                    setErrorText("Passwords do not match");
                    break;
                 case "EmptyFields":
                    setErrorText("Please fill out all the fields.");
                    break;
                case "InvalidCharacters":
                    setErrorText("Invalid characters used in username/password");
                    break;
            }
        }
                    
    });

}
