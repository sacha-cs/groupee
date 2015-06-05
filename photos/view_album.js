function loaded() {
	var content = document.getElementById("content");
    var aClient = new HttpClient();
    aClient.get('get_photos', function(response) {
        var photoInfo = JSON.parse(response);
        console.log(photoInfo);
        for (var i = 0; i < photoInfo.photoList.length; i++) {
            var photoHtml = "<div class='photo' id='" + photoInfo.photoList[i] + "'>" +   
                                "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" +
                                    photoInfo.groupId + "/photos/album" + photoInfo.albumId + "/photo" + photoInfo.photoList[i] + ".jpg'/>" +  
                                "<a onclick='openPhoto(" + photoInfo.photoList[i] + ")'/>" +   
                            "</div>";
            content.innerHTML += photoHtml;
        }
    });
}

function openPhoto() {
    // TODO: Show photo in gallery view (and display comments).
}
