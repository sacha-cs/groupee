function loaded() {
	var username = getCookie('username');
	document.getElementById('avatar').innerHTML = "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/avatars/" 
	+ username + ".png'>"
	document.getElementById('username').value = username;
}

function toggleAccountSettings() {
	document.getElementById('account').style.display = 'block';
}