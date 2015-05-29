postHandler.addHandler("posts/add_note", addNote);
getHandler.addHandler("posts/get_notes", getNotes);

function addNote(request, response, params) {

	pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err, response); }

		var groupId = utils.getViewingGroup(request);
		var username = utils.getUser(request);
        var noteTitle = params.noteTitle;
        var noteContent = params.noteContent;

		var insertNoteQuery = "INSERT INTO note_taker(group_id, username) " +
							  "VALUES('" + groupId + "', '" + username + "') RETURNING note_id";

	 	client.query(insertNoteQuery, function(err, result) {
			var noteId = result.rows[0].note_id;
			if (err) { return utils.respondError(err, response); }
            var insertNoteInfoQuery = "INSERT INTO note(note_id, note_title, note_content) " +
                                      "VALUES(" + noteId + ", '" + noteTitle + "', '" + noteContent + "')";
            client.query(insertNoteInfoQuery, function(err, result) {
                done(client);
                if (err) { return utils.respondError(err, response); }
                return utils.respondPlain(response, "Y");
            })
		})
	})
}

function getNotes(request, response) {
    var currentUser = utils.getUser(request);
    var currentGroup = utils.getViewingGroup(request);
    var getNotesQuery = "SELECT note_id, note_title, note_content " + 
                        "FROM note NATURAL JOIN note_taker " +
                        "WHERE username='" + currentUser + "' AND group_id='" + currentGroup + "'";
    pg.connect(connectionString, function(err, client, done) {
        client.query(getNotesQuery, function(err, result) {
            done(client);
            if(err) { return utils.respondError(err, response); }
            
            var responseString = "";
            if(result.rows.length > 0) {
              /* Populate the groupInfo array with information about the groups associated with
                 the current user. */
                for(var i = 0; i < result.rows.length; i++) {
                    var row = result.rows[i];
                    var noteTitle = encodeURIComponent(row.note_title);
                    var noteContent = encodeURIComponent(row.note_content);
                    var noteId = row.note_id;
                    responseString += "noteId=" + noteId + "&noteTitle=" + noteTitle + "&noteContent=" + noteContent + "#";
                }
            }
            response.write(responseString);
            response.end();
        });
    });
}


