var photoInformation;
var keyBindings = {left: 37, right: 39, esc: 27, enter: 13};
var deleteIcon = 'http://natpat.net/groupee/icons/close.png';
var prefix = 'http://natpat.net/groupee';

function loaded() {
    getAllPhotos();
}

function getAllPhotos() {
    var content = document.getElementById("content");
    var aClient = new HttpClient();
    aClient.get('get_photos', function(response) {
        var photoInfo = JSON.parse(response);
        photoInformation = photoInfo;
        content.innerHTML += "<div onclick=popupForm() class='photo' id='new-photo'>" + 
                                "<img src='" + prefix + "/icons/new-album.png'>" +
                             "</div>"
        for (var i = 0; i < photoInfo.photoList.length; i++) {
            var photoHtml = "<div class='photo' id='" + photoInfo.photoList[i] + "' onclick='openPhoto(" + i + ")'>" +   
                                "<img class='thumb' src='" + prefix + "/groups/group" +
                                    photoInfo.groupId + "/photos/album" + photoInfo.albumId + "/thumbnail" + 
                                    photoInfo.photoList[i] + ".jpg'>" +  
                                "<img class='delete' src='" + deleteIcon + "'>" +
                            "</div>";
            content.innerHTML += photoHtml;
        }
        document.getElementById("loading").style.display = "none";
    });
}

function addCommentHtml(htmlId, id) {
    return "<div class='comment card' id='comment-card" + htmlId + "'>" +
                "<div id='comment-box'>" +
                "</div>" + 
                "<input type='text' id='comment-field' placeholder='Add a comment' onkeypress='addComment(" + id + ")'>" +
            "</div>";
}

function openPhoto(index) {
    if (event.target.className == "delete") {
        deletePhoto(index);
        return;
    }

    document.getElementById("opacity-layer").style.visibility = 'visible';
    var gallery = document.getElementById("gallery-view");
    var commentHtml = addCommentHtml(index, photoInformation.photoList[index]);
    var photoHtml = "<div id=photo-wrapper>" + 
                        "<img id='" + index + "' class='gallery-img' src='" + prefix + "/groups/group" +
                        photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                        photoInformation.photoList[index] + ".jpg'>" + commentHtml + 
                    "</div>";

    // Display the large vesrion of the photo.
    gallery.innerHTML = photoHtml;

    getComments(photoInformation.photoList[index]);

    gallery.style.visibility = 'visible';
    gallery.tabIndex = "0";
    gallery.focus();

    resizeCommentBox(index);
}

function addDeleteCommentButton(id) {
    return "<div class='delete-comment'>" +
           "<img id='delete-comment-img' onclick='deleteComment(" + id + ")' " + 
           "src='" + prefix + "/icons/close.png'>" +
           "</div>";
}

function addCommentToBox(text, id, username) {
    var currentUser = getCookie("username");
    var commentHtml = "<li id='comment" + id + "'>" + 
                      "<span class='message'>" + 
                      "<p>" + "<u>" + username + "</u>: " + text + "</p>" + 
                      "</span>" + 
                      (currentUser == username ? addDeleteCommentButton(id) : "") +
                      "</li>";

    // If comment already exists, do not re-add it!
    if (!document.getElementById('comment' + id)) {
        document.getElementById("comment-box").innerHTML += commentHtml;
    }
}

// Adds a comment which has been typed in by the user.
function addComment(id) {
    var commentText = document.getElementById("comment-field").value;

    if (event.keyCode == keyBindings.enter) {
        if (commentText == "") {
            // TODO: Return warning message if no comment entered.
        } else {
            var aClient = new HttpClient();
            var username = getCookie("username");
            var reqObj = {photoId: id, comment: commentText, username: username};
            aClient.post('add_comment', JSON.stringify(reqObj), function(response) {
                response = JSON.parse(response);
                document.getElementById("comment-field").value = "";
                if (!response.success) {
                    // Handle errors.
                } else {
                    // Add comment to comments list.
                    addCommentToBox(commentText, response.id, username);
                }
            });
        }      
    }
}

function deleteComment(id) {
    var aClient = new HttpClient();
    aClient.post('delete_comment', 'id=' + id, function(response) {
        // Remove from HTML.
        document.getElementById('comment-box').removeChild(document.getElementById('comment' + id));
    });
}

function resizeCommentBox(index) {
    var image = document.getElementById(index);
    image.onload = function() {
        document.getElementById("comment-card" + index).style.height = image.height;
    }
}

function changePhoto() {
    var change = false;

    // Make sure user is not entering text!
    if (event.target.tagName != "INPUT") {
        var gallery = document.getElementById("gallery-view");
        var currentPhotoIndex = gallery.getElementsByTagName("img")[0].id;
        var nextPhotoToShowIndex = 0;
        
        if (event.keyCode == keyBindings.left) {
            nextPhotoToShowIndex = --currentPhotoIndex;
            change = true;
        } else if (event.keyCode == keyBindings.right) {
            nextPhotoToShowIndex = ++currentPhotoIndex;
            change = true;
        } else if (event.keyCode == keyBindings.esc) {
            hideGallery();
        }
        
        if (nextPhotoToShowIndex >= 0 && nextPhotoToShowIndex < photoInformation.photoList.length && change) {
            var photoHtml = "<img id='" + nextPhotoToShowIndex + "' src='" + prefix + "/groups/group" +
                                photoInformation.groupId + "/photos/album" + photoInformation.albumId + "/photo" + 
                                photoInformation.photoList[nextPhotoToShowIndex] + ".jpg'>" +
                                addCommentHtml(nextPhotoToShowIndex, photoInformation.photoList[nextPhotoToShowIndex]);
            gallery.innerHTML = photoHtml;

            getComments(photoInformation.photoList[nextPhotoToShowIndex]);
            resizeCommentBox(nextPhotoToShowIndex);
        }
    }
}

function getComments(photoId) {
    var aClient = new HttpClient();
    aClient.get('/photos/get_comments?photo_id=' + photoId, function(response) {
        var commentInfo = JSON.parse(response);
        for (var i = 0; i < commentInfo.comments.length; i++) {
            var currentComment = commentInfo.comments[i];
            // In the case of slow response times, double check that the comment corresponds
            // to the particular photo.
            var viewingPhoto = document.getElementById("gallery-view").getElementsByTagName("img")[0].id;
            var viewingPhotoId = photoInformation.photoList[viewingPhoto];
            if (viewingPhotoId == photoId) {
                addCommentToBox(currentComment.text, currentComment.id, currentComment.username);
            }
        }
    });
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
    if (event.keyCode == keyBindings.esc) {
        document.getElementById("rename-input").style.visibility = 'hidden';
        return;
    }
    if (event.keyCode == keyBindings.enter) {
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
    if (event.keyCode == keyBindings.esc) {
        document.getElementById("rename-input").style.visibility = 'hidden';
    }
    return;
}

function hideGallery() {
    document.getElementById("gallery-view").style.transition = 0 + "s";
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

function chatHasToggled(chatOpen) {
    var innerWidth = parseInt(window.innerWidth, 10);
    document.getElementById("gallery-view").style.transition = 0.3 + "s";
    document.getElementById("content").style.width.left = (innerWidth - (chatOpen ? 335 : 50)) + "px";
    document.getElementById("gallery-view").style.left = (chatOpen ? 335 : 0) + "px";
}

