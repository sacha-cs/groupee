var photoInformation;

function loaded() {
    getAllPhotos();
}

function getAllPhotos() {
    var content = document.getElementById("content");
    content.innerHTML += "<div onclick=popupForm() class='photo' id='new-photo'>" + 
                            "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/new-album.png'>" +
                         "</div>"
    var aClient = new HttpClient();
    aClient.get('get_photos', function(response) {
        var photoInfo = JSON.parse(response);
        photoInformation = photoInfo;
        for (var i = 0; i < photoInfo.photoList.length; i++) {
            var photoHtml = "<div class='photo' id='" + photoInfo.photoList[i] + "' onclick='openPhoto(" + i + ")'>" +   
                                "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInfo.groupId + "/photos/album" + photoInfo.albumId + "/thumbnail" + 
                                    photoInfo.photoList[i] + ".jpg'/>" +  
                                "<a onclick='openPhoto(" + photoInfo.photoList[i] + ")'/>" +   
                            "</div>";
            content.innerHTML += photoHtml;
        }
    });
}

function openPhoto(index) {
    // TODO: Show photo in gallery view (and display comments).
    var gallery = document.getElementById("gallery-view");
    var photoHtml = "<img id='" + index + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                    photoInformation.photoList[index] + ".jpg'/>";
    gallery.innerHTML = photoHtml;
    gallery.tabIndex = "0";
    gallery.focus();
}

function changePhoto() {
    var gallery = document.getElementById("gallery-view");
    var currentPhotoIndex = gallery.getElementsByTagName("img")[0].id;

    if (event.keyCode == 37) {

        var nextPhotoToShowIndex = --currentPhotoIndex;
        if (nextPhotoToShowIndex >= 0) {
            var photoHtml = "<img id='" + nextPhotoToShowIndex + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                photoInformation.photoList[nextPhotoToShowIndex] + ".jpg'/>";
            gallery.innerHTML = photoHtml;
        }

    } else if (event.keyCode == 39) {

        var nextPhotoToShowIndex = ++currentPhotoIndex;
        if (nextPhotoToShowIndex < photoInformation.photoList.length) {
            var photoHtml = "<img id='" + nextPhotoToShowIndex + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                photoInformation.photoList[nextPhotoToShowIndex] + ".jpg'/>";
            gallery.innerHTML = photoHtml;
        }

    }
}

function popupForm() {
    document.getElementById("form-wrapper").style.display = 'initial';
    document.getElementById("form-wrapper").style.width = document.getElementsByClassName("card")[0].clientWidth;
    document.getElementById("form-wrapper").style.height = document.getElementsByClassName("card")[0].clientHeight;
    var photos = document.getElementsByClassName("photo");
    for (var i = 0 ; i < photos.length ; i++) {
        photos[i].style.opacity = 0.4;
    }
    document.getElementById("content").addEventListener('click', hideForm);
    event.stopPropagation();
}

// Hides the upload form
function hideForm(event) {
    if (event.target.className != 'card' && event.target.id != 'form-wrapper' && 
        event.target.tagName != 'INPUT' && event.target.tagName != 'H1') {
        document.getElementById("form-wrapper").style.display = 'none';
        var photos = document.getElementsByClassName("photo");
        for (var i = 0 ; i < photos.length ; i++) {
            photos[i].style.opacity = 1;
        }
    }
}

function deleteAlbum() {
    var aClient = new HttpClient();
    aClient.post('delete_album', function (response) {
    });
    window.location = '/photos/';
}

function renameAlbum() {
    if (event.keyCode == 27) {
        document.getElementById("rename-input").style.visibility = 'hidden';
        return;
    }
    if (event.keyCode == 13) {
        var newAlbumName = document.getElementById("newAlbumName").value;
        var aClient = new HttpClient();
        aClient.post('rename_album', 'newAlbumName=' + newAlbumName,
            function(response) {});
        window.location = '/photos/view_album.html';
    }
}

function showRenamePopover() {
    var span = document.getElementById("rename-input");
    if (span.style.visibility == 'hidden' || !span.style.visibility) {
        span.style.visibility = 'visible';
    } else {
        span.style.visibility = 'hidden';
    }
}

function hideRenamePopover() {
    if (event.keyCode == 27) {
        document.getElementById("rename-input").style.visibility = 'hidden';
    }
    return;
}