postHandler.addHandler("photos/create_album", createAlbum);
getHandler.addHandler("photos/get_albums", getAllAlbums);
postHandler.addHandler("photos/upload_photos", uploadPhotos, false, {"multiples":true});
getHandler.addHandler("photos/view_album", setViewingAlbum);

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
    		if (doesAlbumExistInGroupResult.rows.length == 1) {
    			// Safety check done
    			// TODO: return all the photo_ids corresponding to the album_id in the response
                var getAlbumsForGroupQuery = "SELECT photo_id " +
                                             "FROM photos " +
                                             "WHERE album_id=" + album_id;
            
                // Store the album that we are currently viewing in the cookie.
                utils.setViewingAlbum(request, album_id);
                client.query(getAlbumsForGroupQuery, function(err, albumsResult) {
    		        done(client);
                    var albumList = albumsResult.rows;
                    response.writeHead("307", {'Location' : 'view_album.html' }); 
                    response.end(JSON.stringify(albumList));
                });
    		} else {
    			response.writeHead("307", {'Location' : '/404.html' });
    		}
    		response.end();
    	});
    }); 
}


function uploadPhotos(request, response, data, files) {
	var numFiles = files["upload[]"].length;
	var groupId = utils.getViewingGroup(request);
	var viewingAlbum = utils.getViewingAlbum(request);

	var form = new FormData();
	form.append('groupId', groupId);
	form.append('numFiles', numFiles);
    form.append('albumId', viewingAlbum);
    for (var i = 0 ; i < numFiles ; i++) {
    	console.log(files[i].path);
    	form.append(i, fs.createReadStream(files[i].path));
    }

    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/uploadPhotos.php', function (err, res) {
    	for (var i = 0 ; i < numFiles ; i++) {
        	fs.unlink(files[i].path);
    	}
        response.writeHead("303", {'Location' : '/photos/view_album.html' });
        response.end();
    });

}

