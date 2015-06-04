function popupForm() {
	document.getElementById("form-wrapper").style.display = 'initial';
	document.getElementById("form-wrapper").style.width = document.getElementsByClassName("create-card")[0].clientWidth;
	document.getElementById("form-wrapper").style.height = document.getElementsByClassName("create-card")[0].clientHeight;
	var albums = document.getElementsByClassName("view");
	for (var i = 0 ; i < albums.length ; i++) {
		albums[i].style.opacity = 0.4;
	}
	document.getElementById("content").addEventListener('click', hideForm);
}

function hideForm(event) {
	if (event.target.className != 'create-card' && event.target.id != 'form-wrapper' 
		&& event.target.tagName != 'A' && event.target.tagName != 'INPUT' && event.target.tagName != 'H1') {
		document.getElementById("form-wrapper").style.display = 'none';
		var albums = document.getElementsByClassName("view");
		for (var i = 0 ; i < albums.length ; i++) {
			albums[i].style.opacity = 1;
		}
	}
}

function createAlbum() {
	var albumName = document.getElementById('album_name').value;
	var description = document.getElementById('description').value;

	setErrorText("");
    if(albumName == "")
    {
        setErrorText("Please enter an album name");
        return;
    }

	var aClient = new HttpClient();
	aClient.post('create_album', 'albumName=' + albumName +
								 '&description=' + description, 
	function(response) {

	});
}