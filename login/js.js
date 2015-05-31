function setUpListeners() {
	document.getElementsByClassName('username')[0].onkeypress = keyListenerLogin;
    document.getElementsByClassName('password')[0].onkeypress = keyListenerLogin;
	document.getElementsByClassName('username')[1].onkeypress = keyListenerRegister;
    document.getElementsByClassName('password')[1].onkeypress = keyListenerRegister;
    document.getElementById('passwordconfirm').onkeypress = keyListenerRegister;
}

function keyListenerLogin(e) {
    var event = e || window.event;
    var charCode = event.which || event.keyCode;

    if (charCode == '13')
            login();
}

function keyListenerRegister(e) {
    var event = e || window.event;
    var charCode = event.which || event.keyCode;

    if (charCode == '13')
            register();
}


function login()
{
    var username = document.getElementsByClassName('username')[0].value;
    var password = document.getElementsByClassName('password')[0].value;

    setErrorTextLogin("");
    if(username == "" || password == "")
    {
        setErrorTextLogin("Please fill out all fields.");
        return;
    }

    aClient = new HttpClient();
    aClient.post('/login/login', 'username=' + username + 
                          '&password=' + password, 
    function (response) {
        var correct = response[0];
        if(correct == "Y") {
            var parts = response.slice(1).split('#');
            document.cookie="seshCookie="+parts[0]+";path=/";
            document.cookie="username="+parts[1]+";path=/";
            window.location = "/groups/index.html";
        } else {
            switch(response.slice(1)) {
                case "IncorrectPassword":
                    setErrorTextLogin("Incorrect Password.");
                    break;
                 case "NoUser":
                    setErrorTextLogin("No User with that Username.");
                    break;
                 case "EmptyFields":
                    setErrorTextLogin("Please fill out all the fields.");
                    break;
            }
        }
    });
}

function setErrorTextLogin(error) {
    document.getElementById("loginError").innerHTML = error;
    return;
}

function setErrorTextRegister(error) {
    document.getElementById("registerError").innerHTML = error;
    return;
}

function register()
{
    setErrorTextRegister("");
    var username = document.getElementsByClassName("username")[1].value;
    var password = document.getElementsByClassName("password")[1].value;
    var passwordconfirm = document.getElementById("passwordconfirm").value;

    if(username == "" || password == "" || passwordconfirm == "")
    {
        setErrorTextRegister("Please fill out all fields.");
        return;
    }

    if(password != passwordconfirm)
    {
        setErrorTextRegister("Passwords do not match");
        return;
    }

    aClient = new HttpClient();
    aClient.post('/login/register', 'username=' + username + 
                         '&password=' + password +
                         '&passwordconfirm=' + passwordconfirm,
    function (response) {
        var correct = response[0];
        if(correct == "Y") {
            var parts = response.slice(1).split('#');
            document.cookie="seshCookie="+parts[0]+";path=/";
            document.cookie="username="+parts[1]+";path=/";
            window.location = "/welcome";
        } else {
            switch(response.slice(1)) {
                case "UsernameTaken":
                    setErrorTextRegister("Username is already taken")
                    break;
                case "UnknownError":
                    setErrorTextRegister("Something went wrong...");
                    break;
                 case "PasswordsDifferent":
                    setErrorTextRegister("Passwords do not match");
                    break;
                 case "EmptyFields":
                    setErrorTextRegister("Please fill out all the fields.");
                    break;
                case "InvalidCharacters":
                    setErrorTextRegister("Invalid characters used in username/password");
                    break;
            }
        }
    });
}
