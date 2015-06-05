postHandler.addHandler("photos/create_album", createAlbum);
getHandler.addHandler("photos/get_albums", getAllAlbums);
getHandler.addHandler("photos/get_photos", getAllPhotos);
getHandler.addHandler("photos/view_album", setViewingAlbum);
postHandler.addHandler("photos/upload_photos", uploadPhotos, false, {"multiples":true});

function createAlbum(request, response, params) {
    
    pg.connect(connectionString, function(err, client, done) {
        if(err) { return utils.respondError(err ,response); }

        var group_id = utils.getViewingGroup(request);
        var album_name = params.albumName;
        var description = params.description;

        var insertAlbumQuery = "INSERT INTO albums(name, description, group_id) " +
                              "VALUES('" + album_name + "', '" + 
                                description + "', " 
                                + group_id + ") RETURNING album_id";  

        client.query(insertAlbumQuery, function(err, insertAlbumResult) {
            done(client);

            var albumId = insertAlbumResult.rows[0].album_id;
            createAlbumDirectory(group_id, albumId);

            if (err) { return utils.respondError(err, response); }

            return utils.respondPlain(response, "Y");
        })
    })
}

function getAllAlbums(request, response, params) {

    var group_id = utils.getViewingGroup(request);
    var getAlbumsQuery = "SELECT album_id, name, description " +
                         "FROM albums " + 
                         "WHERE group_id='" + group_id + "'";

    pg.connect(connectionString, function(err, client, done) {
        client.query(getAlbumsQuery, function(err, result) {
            done(client);
            if(err) { return utils.respondError(err, response); }
            
            var responseString = "";
            if (result.rows.length > 0) {
                for (var i = 0 ; i < result.rows.length ; i++) {
                    var row = result.rows[i];
                    var albumId = row.album_id;
                    var albumName = encodeURIComponent(row.name);
                    var description = encodeURIComponent(row.description);
                    responseString += "albumId=" + albumId +
                                      "&albumName=" + albumName +  
                                      "&description=" + description + "#";
                }
            }

            response.write(responseString);
            response.end();
    
        });
    });
}

function createAlbumDirectory(group_id, album_id) {
    var form = new FormData();
    form.append('group_id', group_id);
    form.append('album_id', album_id);

    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/createAlbumDirectory.php', function (err, res) {
    });
}


function setViewingAlbum(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        var group_id = utils.getViewingGroup(request);
        var album_id = params.album_id; 
        var doesAlbumExistInGroupQuery = "SELECT * " +
                                         "FROM albums " +
                                         "WHERE album_id=" + album_id + " AND group_id=" + group_id;

        // Check if the group actually owns the specific album.
    	client.query(doesAlbumExistInGroupQuery, function(err, doesAlbumExistInGroupResult) {
            done(client);
            if (doesAlbumExistInGroupResult.rows.length == 1) {
                // Safety check done
                // TODO: return all the photo_ids corresponding to the album_id in the response
            
                // Store the album that we are currently viewing in the cookie.
                utils.setViewingAlbum(request, album_id);
                response.writeHead("307", {'Location' : 'view_album.html' }); 
            } else {
                response.writeHead("307", {'Location' : '/404.html' });
            }
            response.end();
        });
    }); 
}

function getAllPhotos(request, response, params) {
    pg.connect(connectionString, function(err, client, done) {
        var group_id = utils.getViewingGroup(request);
        var album_id = utils.getViewingAlbum(request);  
        var getPhotosQuery = "SELECT photo_id " +
                             "FROM photos " +
                             "WHERE album_id=" + album_id;
        client.query(getPhotosQuery, function(err, result) {
            done(client);
            var photoList = [];
            for (var i = 0; i < result.rows.length; i++) {
                photoList.push(result.rows[i].photo_id)
            }
            response.end(JSON.stringify(photoList));
        });
    });
}

function uploadPhotos(request, response, data, files) {
    var numFiles = files["upload[]"].length;
    var groupId = utils.getViewingGroup(request);
    var viewingAlbum = utils.getViewingAlbum(request);

	var form = new FormData();
	form.append('groupId', groupId);
	if (!numFiles) {
		numFiles = 1;
	} else {
			form.append('numFiles', numFiles);
	}
    form.append('albumId', viewingAlbum);

    pg.connect(connectionString, function(err, client, done) {
    	var insertPhotoQuery = "INSERT INTO photos(album_id) " + 
    	 					   "VALUES(" + viewingAlbum + ") RETURNING photo_id";

    	for (var i = 0 ; i < numFiles ; i++) {
    		(function(i) {
	    	client.query(insertPhotoQuery, function(err, insertPhotoResult) {
	    		var photo_id = insertPhotoResult.rows[0].photo_id;
	    		if (numFiles == 1) {
	    			form.append(photo_id, fs.createReadStream(files["upload[]"].path));
	    		} else {
	    			form.append(photo_id, fs.createReadStream(files["upload[]"][i].path));
	    		}
	    		if (i == numFiles-1) {
	    			done(client);
    			    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/uploadPhotos.php', function (err, res) {
    			    	res.pipe(process.stdout);
				    	for (var i = 0 ; i < numFiles ; i++) {
				    		if (numFiles == 1) {
				        		fs.unlink(files["upload[]"].path);
				    		} else {
				    			fs.unlink(files["upload[]"][i].path);
				    		}
				    	}
				        response.writeHead("303", {'Location' : '/photos/view_album.html' });
				        response.end();
			    	});
	    		}
	    	});
	    	})(i); 
	    }

    })
}

