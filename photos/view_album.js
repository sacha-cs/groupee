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
                                "<img class='thumb' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInfo.groupId + "/photos/album" + photoInfo.albumId + "/thumbnail" + 
                                    photoInfo.photoList[i] + ".jpg'/>" +  
                                "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/close.png'>" +
                            "</div>";
            content.innerHTML += photoHtml;
        }
    });
}

function addCommentHtml(id) {
    return "<div class='card' id='comment'>" +
            "<div id='comment-box'><ol id='comment-list'></ol></div>" + 
            "<input type='text' id='comment-field' placeholder='Add a comment' onkeydown='addComment(" + id + ")'>" +
        "</div>";
}

function openPhoto(index) {
    if (event.target.className == "delete") {
        deletePhoto(index);
        return;
    }
    // TODO: Show photo in gallery view (and display comments).
    document.getElementById("opacity-layer").style.visibility = 'visible';
    var gallery = document.getElementById("gallery-view");
    var commentHtml = addCommentHtml(photoInformation.photoList[index]);
    var photoHtml = "<div id=photo-wrapper><img id='" + index + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                    photoInformation.photoList[index] + ".jpg'/>" + commentHtml + 
                    "</div>";
    gallery.innerHTML = photoHtml;
    gallery.style.visibility = 'visible';
    gallery.tabIndex = "0";
    gallery.focus();

    var image = document.getElementById(index);
    image.onload = function(){
        document.getElementById("comment").style.height = image.height;
    }
}

function addComment(id) {
    var commentText = document.getElementById("comment-field").value;

    if (event.keyCode == 13) {
        /* setErrorText("");
        if (commentText == "") {
            setErrorText("You havent commented anything.");
        }*/    
        
        var aClient = new HttpClient();
        var reqObj = {photoId: id, comment: commentText};
        aClient.post('add_comment', JSON.stringify(reqObj), function(response) {
            response = JSON.parse(response);
            if (!response.success) {
               // Handle errors.
            } else {
                // Add comment to comments list.
                var commentItem = "<li><p>" + commentText + "</p></li>";
                document.getElementById("comment-list").innerHTML += commentItem;
                console.log(document.getElementById("comment-list").innerHTML);
            }
        });
    }
}

function changePhoto() {

    if (event.keyCode == 27) {
        hideGallery();
    }

    var gallery = document.getElementById("gallery-view");
    var currentPhotoIndex = gallery.getElementsByTagName("img")[0].id;

    if (event.keyCode == 37) {

        var nextPhotoToShowIndex = --currentPhotoIndex;
        if (nextPhotoToShowIndex >= 0) {
            var photoHtml = "<img id='" + nextPhotoToShowIndex + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                photoInformation.photoList[nextPhotoToShowIndex] + ".jpg'/>" +
                                addCommentHtml(photoInformation.photoList[nextPhotoToShowIndex]);
            gallery.innerHTML = photoHtml;
            var image = document.getElementById(nextPhotoToShowIndex);
            image.onload = function(){
                document.getElementById("comment").style.height = image.height;
            }
        }

    } else if (event.keyCode == 39) {

        var nextPhotoToShowIndex = ++currentPhotoIndex;
        if (nextPhotoToShowIndex < photoInformation.photoList.length) {
            var photoHtml = "<img id='" + nextPhotoToShowIndex + "' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                photoInformation.photoList[nextPhotoToShowIndex] + ".jpg'/>" +
                                addCommentHtml(photoInformation.photoList[nextPhotoToShowIndex]);
            gallery.innerHTML = photoHtml;
            var image = document.getElementById(nextPhotoToShowIndex);
            image.onload = function(){
                document.getElementById("comment").style.height = image.height;
            }
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

function hideGallery() {
    document.getElementById("gallery-view").style.visibility = 'hidden';
    document.getElementById("opacity-layer").style.visibility = 'hidden';
}


function deletePhoto(index) {
    var photoIdToDelete = photoInformation.photoList[index];
    var aClient = new HttpClient();
    aClient.post("delete_photo", "photoIdToDelete=" + photoIdToDelete,
        function(response) {
            location.reload(true);
        });
} 
