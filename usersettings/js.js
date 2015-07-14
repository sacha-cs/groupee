function loaded() {
	var username = getCookie('username');
	document.getElementById('avatar').innerHTML = "<img src='http://natpat.net/groupee/avatars/" 
	+ username + ".png'>";
}

function toggleAccountSettings() {
	document.getElementById('account').style.display = 'block';
	document.getElementById('password').style.display = 'none';
}

function togglePasswordSettings() {
	document.getElementById('password').style.display = 'block';
	document.getElementById('account').style.display = 'none';

	document.getElementById("current-password").addEventListener('keypress', function (e) {
		if (e.keyCode == 13) {
			changePassword();
		}
	});

	document.getElementById("new-password").addEventListener('keypress', function (e) {
		if (e.keyCode == 13) {
			changePassword();
		}
	});

	document.getElementById("new-password-confirm").addEventListener('keypress', function (e) {
		if (e.keyCode == 13) {
			changePassword();
		}
	});
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
        response = JSON.parse(response);
		if (response.success) {
			setSuccessText("Password changed successfully");
		} else {
            setErrorText(response.error);
		}
	});
}
