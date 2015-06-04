postHandler.addHandler("photos/create_album", createAlbum);
getHandler.addHandler("photos/get_albums", getAllAlbums);

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
			//TODO: write some php script to create directory for that albumId
			
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