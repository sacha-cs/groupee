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
        setErrorTextLogin("Please fill out all fields");
        return;
    }

    var loginButton = document.getElementById('login-button');
    var loadingWheel = document.getElementById('login-loading');
    loginButton.style.visibility = "hidden";
    loadingWheel.style.display = "block";
    aClient = new HttpClient();
    aClient.post('/login/login', 'username=' + username + 
                          '&password=' + password, 
    function (response) {
        response = JSON.parse(response);
        var success = response.success;
        if(success) {
            document.cookie="seshCookie="+response.seshCookie+";path=/";
            document.cookie="username="+response.username+";path=/";
            window.location = "/groups/";
        } else {
            loginButton.style.visibility = "visible";
            loadingWheel.style.display = "none";
            setErrorTextLogin(response.error);
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
        setErrorTextRegister("Please fill out all fields");
        return;
    }

    if(password != passwordconfirm)
    {
        setErrorTextRegister("Passwords do not match");
        return;
    }

    var registerButton = document.getElementById('register-button');
    var loadingWheel = document.getElementById('register-loading');
    registerButton.style.visibility = "hidden";
    loadingWheel.style.display = "block";
    aClient = new HttpClient();
    aClient.post('/login/register', 'username=' + username + 
                         '&password=' + password +
                         '&passwordconfirm=' + passwordconfirm,
    function (response) {
        response = JSON.parse(response);
        var correct = response.success;
        if(correct) {
            document.cookie="seshCookie="+response.seshCookie+";path=/";
            document.cookie="username="+response.username+";path=/";
            window.location = "/welcome";
        } else {
            registerButton.style.visibility = "visible";
            loadingWheel.style.display = "none";
            setErrorTextRegister(response.error);
        }
    });
}
