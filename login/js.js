function setUpListeners() {
    document.getElementById('username').onkeypress = keyListener;
    document.getElementById('password').onkeypress = keyListener;
    if(window.location.pathname!="/login/" &&
       window.location.pathname!="/login/index.html")
        document.getElementById('passwordconfirm').onkeypress = keyListener;
}

function keyListener(e) {
    var event = e || window.event;
    var charCode = event.which || event.keyCode;

    if ( charCode == '13' ) {
        console.log(window.location.pathname);
        if(window.location.pathname=="/login/" ||
           window.location.pathname=="/login/index.html")
            login();
        else
            register();
        return false;
    }
}

function login()
{
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    setErrorText("");
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
            var parts = response.slice(1).split('#');
            document.cookie="seshCookie="+parts[0]+";path=/";
            document.cookie="username="+parts[1]+";path=/";
            window.location = "/groups/create.html";
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
    setErrorText("");
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
