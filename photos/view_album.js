function loaded() {
    var content = document.getElementById("content");
    content.innerHTML += "<div onclick=popupForm() class='photo' id='new-photo'>" + 
                            "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/new-album.png'>" +
                         "</div>"
    var aClient = new HttpClient();
    aClient.get('get_photos', function(response) {
        var photoInfo = JSON.parse(response);
        for (var i = 0; i < photoInfo.photoList.length; i++) {
            var photoHtml = "<div class='photo' id='" + photoInfo.photoList[i] + "'>" +   
                                "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInfo.groupId + "/photos/album" + photoInfo.albumId + "/thumbnail" + 
                                    photoInfo.photoList[i] + ".jpg'/>" +  
                                "<a onclick='openPhoto(" + photoInfo.photoList[i] + ")'/>" +   
                            "</div>";
            content.innerHTML += photoHtml;
        }
    });
}

function openPhoto() {
    // TODO: Show photo in gallery view (and display comments).
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
