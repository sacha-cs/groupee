function loaded() {
	var username = getCookie('username');
	document.getElementById('avatar').innerHTML = "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" 
	+ username + ".png'>"
	document.getElementById('username').value = username;
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