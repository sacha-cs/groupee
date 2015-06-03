function loaded() {
	var username = getCookie('username');
	document.getElementById('avatar').innerHTML = "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" 
	+ username + ".png'>"
}

function toggleAccountSettings() {
	document.getElementById('account').style.display = 'block';
	document.getElementById('password').style.display = 'none';
	document.getElementById('groups').style.display = 'none';
}

function togglePasswordSettings() {
	document.getElementById('password').style.display = 'block';
	document.getElementById('account').style.display = 'none';
	document.getElementById('groups').style.display = 'none';
}

function toggleGroupsSettings() {
	document.getElementById('groups').style.display = 'block';
	document.getElementById('account').style.display = 'none';
	document.getElementById('password').style.display = 'none';
}


function changePassword() {

	setErrorText("");
	setSuccessText("");

	var currentPassword = document.getElementById('current-password').value;
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;

	if (currentPassword == '' || newPassword == '' || newPasswordConfirm == '') {
		setErrorText("Please complete all fields");
		return;
	}

	if (newPassword != newPasswordConfirm) {
		setErrorText("Passwords do not match");
		return;
	}

	var aClient = new HttpClient();
	aClient.post('/usersettings/change_password', 'currentPassword=' + currentPassword + 
		                                          '&newPassword=' + newPassword +
		                                          '&newPasswordConfirm=' + newPasswordConfirm,
	function(response) {
		var correct = response[0];
		if (correct == "Y") {
			setSuccessText("Password changed successfully");
		} else {
			switch(response.slice(1)){
				case "IncorrectPassword":
					setErrorText("Password is incorrect");
					break;
				default:
					setErrorText("An error has occured, please try again");
					break;
			}
		}
	});
}
