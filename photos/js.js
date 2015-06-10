function popupForm() {
	document.getElementById("form-wrapper").style.display = 'initial';
	document.getElementById("form-wrapper").style.width = document.getElementsByClassName("card")[0].clientWidth;
	document.getElementById("form-wrapper").style.height = document.getElementsByClassName("card")[0].clientHeight;
	var albums = document.getElementsByClassName("view");
	for (var i = 0 ; i < albums.length ; i++) {
		albums[i].style.opacity = 0.4;
	}
	document.getElementById("content").addEventListener('click', hideForm);
}

function hideForm(event) {
	if (event.target.className != 'card' && event.target.id != 'form-wrapper' 
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
		var albumsInfo = JSON.parse(response);
		for (var i = 0 ; i < albumsInfo.albums.length ; i++) {
			var albumId = albumsInfo.albums[i].albumId;
			var albumName = albumsInfo.albums[i].albumName;
			var albumDescription = albumsInfo.albums[i].description;
            var thumb = albumsInfo.albums[i].thumb;

            var albumHtml = "<div class='view' id='" + albumId + "'>" + 
                            "<img src=" + (thumb ? ("'http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                albumsInfo.groupId + "/photos/album" + albumId + "/thumbnail" + thumb + ".jpg'>")
                            : "'http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/default-album.png'>") +  
     					    "<div class='mask'>" +  
     						"<h2>" + albumName + "</h2>" +  
     						"<p>" + albumDescription + "</p>" + 
         					"<a onclick='openAlbum(" + albumId + ")' class='info'>Open Album</a>" +   
							"</div>" +  
							"</div>";
    
           	content.innerHTML += albumHtml;
		}
		document.getElementById("add-album").style.visibility = 'visible';
		document.getElementById("loading").style.display = "none";
	});
}

function openAlbum(album_id) {
	window.location = "view_album?album_id=" + album_id; 
}
