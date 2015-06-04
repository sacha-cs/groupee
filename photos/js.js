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
		if (response[0] == "Y") {
			location.reload(true);
		} else {
			setErrorText("Something went wrong...");
		}
	});
}

function loaded() {
	getAllAlbums();
}

function getAllAlbums() {

	var content = document.getElementById("content");

	var aClient = new HttpClient();
	aClient.get('get_albums', function(response) {
		console.log(response);
		var albumItemList = response.split("#");
		for (var i = 0 ; i < albumItemList.length-1 ; i++) {
			var albumItem = albumItemList[i].split("&");
			var albumIdInfo = albumItem[0];
			var albumNameInfo = albumItem[1];
			var albumDescriptionInfo = albumItem[2];
            var info = {albumId : albumIdInfo.split("=")[1],
            			albumName : escapeHtml(decodeURIComponent(albumNameInfo.split("=")[1])),
            			albumDescription : escapeHtml(decodeURIComponent(albumDescriptionInfo.split("=")[1]))};

            var albumHtml = "<div class='view' id='" + info.albumId + "'>" +   
     					    "<img src='http://www.vincedelmontefitness.com/blog/wp-content/uploads/2013/11/iStock_000015817907Small.jpg'/>" +  
     					    "<div class='mask'>" +  
     						"<h2>" + info.albumName + "</h2>" +  
     						"<p>" + info.albumDescription + "</p>" + 
         					"<a href='#' class='info'>Open Album</a>" +   
							"</div>" +  
							"</div>";

           	content.innerHTML += albumHtml;
		}
	});
}