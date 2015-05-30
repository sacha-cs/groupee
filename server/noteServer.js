postHandler.addHandler("posts/add_note", addNote, true);
getHandler.addHandler("posts/get_notes", getNotes);

function addNote(request, response, data) {
    var parsedData = JSON.parse(data);
    var groupId = utils.getViewingGroup(request);
    var username = utils.getUser(request);
    var noteTitle = parsedData.noteTitle;
    var noteContent = parsedData.noteContent;
    var insertNoteQuery = "INSERT INTO note(note_title, note_content, group_id, username) " +
                          "VALUES('" + noteTitle + "', '" + noteContent + "', " + groupId + ", '" + username + "')" + 
                          "RETURNING note_id"; 
	pg.connect(connectionString, function(err, client, done) {
	 	client.query(insertNoteQuery, function(err, result) {
            done(client);
			var noteId = result.rows[0].note_id;
			if (err) { return utils.respondError(err, response); }
            return utils.respondPlain(response, "Y" + noteId);
		})
	})
}

function getNotes(request, response) {
    /*var currentUser = utils.getUser(request);
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
    });*/
}


