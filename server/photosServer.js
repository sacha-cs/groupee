postHandler.addHandler("photos/create_album", createAlbum);

function createAlbum(request, response, params) {
	
	pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err ,response); }

		var group_id = utils.getViewingGroup(request);
		var album_name = params.albumName;
		var description = params.description;

		var insertAlbumQuery = "INSERT INTO albums(name, description, group_id) " +
							  "VALUES('" + album_name + "', '" + 
							  	description + "', " 
							  	+ group_id + ")";  

		client.query(insertAlbumQuery, function(err, insertAlbumResult) {
			done(client);
			if (err) { return utils.respondError(err, response); }

			return utils.respondPlain(response, "Y");
		})
	})
}