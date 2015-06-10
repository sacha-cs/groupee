postHandler.addHandler("photos/create_album", createAlbum);
getHandler.addHandler("photos/get_albums", getAllAlbums);
getHandler.addHandler("photos/get_photos", getAllPhotos);
getHandler.addHandler("photos/get_comments", getAllComments);
getHandler.addHandler("photos/view_album", setViewingAlbum);
postHandler.addHandler("photos/upload_photos", uploadPhotos, false, {"multiples":true});
postHandler.addHandler("photos/delete_album", deleteAlbum);
postHandler.addHandler("photos/rename_album", renameAlbum);
postHandler.addHandler("photos/delete_photo", deletePhoto);
postHandler.addHandler("photos/add_comment", addComment);
postHandler.addHandler("photos/delete_comment", deleteComment);

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

    var getAlbumsQuery =
            "SELECT DISTINCT albums.album_id, albums.name, description, " +
            "(MIN(photo_id) OVER (PARTITION BY albums.album_id)) " + 
            "AS thumb FROM photos RIGHT JOIN albums USING (album_id) WHERE group_id=" + 
        group_id;

    pg.connect(connectionString, function(err, client, done) {
        client.query(getAlbumsQuery, function(err, result) {
            done(client);
            if(err) { return utils.respondError(err, response); }
            
            var responseObj = {groupId: group_id, albums: []};
            if (result.rows.length > 0) {
                for (var i = 0 ; i < result.rows.length ; i++) {
                    var row = result.rows[i];
                    responseObj.albums.push({albumId: row.album_id, albumName: row.name, description: row.description, thumb: row.thumb});
                }
            }
            utils.respondJSON(response, responseObj);
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
        var groupId = utils.getViewingGroup(request);
        var albumId = utils.getViewingAlbum(request);  
        var getPhotosQuery = "SELECT photo_id " +
                             "FROM photos " +
                             "WHERE album_id=" + albumId;
        client.query(getPhotosQuery, function(err, result) {
            done(client);
            var photoInfo = {groupId: groupId, albumId: albumId, photoList: []};
            for (var i = 0; i < result.rows.length; i++) {
                photoInfo.photoList.push(result.rows[i].photo_id);
            }
            utils.respondJSON(response, photoInfo);
        });
    });
}

function uploadPhotos(request, response, data, files) {
    var numFiles = files["upload[]"].length;
    var groupId = utils.getViewingGroup(request);
    var viewingAlbum = utils.getViewingAlbum(request);

	var form = new FormData();
	form.append('groupId', groupId);
    if (files["upload[]"].name != '') {
    	if (!numFiles) {
    		numFiles = 1;
    	} else {
    			form.append('numFiles', numFiles);
    	}
    } else {
        fs.unlink(files["upload[]"].path);
        response.writeHead("303", {'Location' : '/photos/view_album.html' });
        response.end();
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


function deleteAlbum(request, response, params) {
    // Remove from database in albums and photos table
    // Run some php script to remove directory for the album
    var albumToDelete = utils.getViewingAlbum(request);
    var groupId = utils.getViewingGroup(request);


    var removeFromAlbumsQuery = "DELETE FROM albums " +
                                "WHERE album_id='" + albumToDelete + "'";

    var removeFromPhotosQuery = "DELETE FROM photos " +
                                "WHERE album_id='" + albumToDelete + "'";

    var form = new FormData();
    form.append('albumId', albumToDelete);
    form.append('groupId', groupId);

    pg.connect(connectionString, function(err, client, done) {
        client.query(removeFromPhotosQuery, function(err, removeFromAlbumsResult) {
            client.query(removeFromAlbumsQuery, function(err, removeFromPhotosResult) {
                done(client);
                form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/deleteAlbum.php');
                response.end();
            });
        });
    });
}

function renameAlbum(request, response, params) {
    var albumToRename = utils.getViewingAlbum(request);
    var newAlbumName = params.newAlbumName;

    var renameAlbumQuery = "UPDATE albums " +
                           "SET name='" + newAlbumName + "' " +
                           "WHERE album_id=" + albumToRename;

    pg.connect(connectionString, function(err, client, done) {
        client.query(renameAlbumQuery, function(err, renameAlbumResult) {
            done(client);
            response.end();
        });
    });
}

function deletePhoto(request, response, params) {
    var albumId = utils.getViewingAlbum(request);
    var photoId = params.photoIdToDelete;
    var groupId = utils.getViewingGroup(request);

    var deletePhotoQuery = "DELETE FROM photos " +
                           "WHERE photo_id=" + photoId;

    var form = new FormData();
    form.append('groupId', groupId);
    form.append('albumId', albumId);
    form.append('photoId', photoId);

    pg.connect(connectionString, function(err, client, done) {
        client.query(deletePhotoQuery, function(err, deletePhotoResult) {
            done(client);
            form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/deletePhoto.php');
            response.pipe(process.stdout)
            response.end();
        });
    })    
}

function addComment(request, response, params) {
    var parsedObj = JSON.parse(Object.keys(params)[0]); 
    var id = parsedObj.photoId;
    var comment = parsedObj.comment;
    var username = parsedObj.username;
    
    var addCommentQuery = "INSERT INTO photos_comments(text, photo_id, username) " + 
                          "VALUES ('" + comment + "', " + id + ", '" + username + "') " +
                          "RETURNING comment_id";
    pg.connect(connectionString, function(err, client, done) {
        client.query(addCommentQuery, function(err, result) {
            done(client);
            var payload = {
                success: true, id: result.rows[0].comment_id
            }
            utils.respondJSON(response, payload);
        });         
    });
}

function deleteComment(request, response, params) {
    var id = params.id;
    var deleteCommentQuery = "DELETE FROM photos_comments " +
                             "WHERE comment_id=" + id;

    pg.connect(connectionString, function(err, client, done) {
        client.query(deleteCommentQuery, function(err, result) {
            done(client);
            var payload = {
                success: true 
            }
            utils.respondJSON(response, payload);
        });
    })    
}

function getAllComments(request, response, params) {
    var id = params.photo_id;
    var viewingGroup = utils.getViewingGroup(request);
    var success = false;
    var getCommentsQuery = "SELECT photo_id, comment_id, text, photos_comments.username, " +
                           "photo_id, albums.group_id " +
                           "FROM (photos_comments " +
                           "LEFT JOIN photos USING (photo_id)) " +
                           "JOIN albums USING (album_id) " + 
                           "WHERE photo_id=" + id;

    pg.connect(connectionString, function(err, client, done) {
        client.query(getCommentsQuery, function(err, result) {
            done(client);
            var commentList = [];
            var data = result.rows;
            var payload = {
                success: success,
                comments: []
            }
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                if (row.group_id == viewingGroup) { 
                    commentList.push({
                        id: row.comment_id, 
                        username: row.username,
                        text: row.text,
                        photoId: row.photo_id
                    });
                    success = true;
                }
            } 
            
            payload.success = success;
            payload.comments = commentList;
            if (!success) {
                response.writeHead("307", {'Location' : '/404.html' });
                response.end();
            } else {
                utils.respondJSON(response, payload); 
            }
        });
    }); 
    
}
