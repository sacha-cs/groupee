postHandler.addHandler("posts/add_note", addNote, true);
postHandler.addHandler("posts/update_note", updateNote, true);
postHandler.addHandler("posts/delete_note", deleteNote, true);
getHandler.addHandler("posts/get_notes", getNotes, true);

// Add a fresh note to the database.
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
		});
	});
}

// Update a note with a given id.
function updateNote(request, response, data) {
    var parsedData = JSON.parse(data);
    var id = parsedData.noteId;
    var title = parsedData.noteTitle;
    var content = parsedData.noteContent;

    var updateNoteQuery = 
        "UPDATE note " +
        "SET note_title='" + title + "', " +
        "note_content='" + content + "' " +
        ((parsedData.x && parsedData.y) ? (", x=" + parseInt(parsedData.x, 10) + ", y=" + parseInt(parsedData.y, 10) + " ") : "") +
        "WHERE note_id=" + id;
    
	pg.connect(connectionString, function(err, client, done) {
	 	client.query(updateNoteQuery, function(err, result) {
            done(client);
			if (err) { return utils.respondError(err, response); }
            return utils.respondPlain(response, "Y");
		});
	});
}

function deleteNote(request, response, data) {
    var parsedData = JSON.parse(data);
    var id = parsedData.noteId;
    
    var removeNoteQuery = "DELETE FROM note " +
                          "WHERE note_id=" + id;

    pg.connect(connectionString, function(err, client, done) {
        client.query(removeNoteQuery, function(err, result) {
            done(client);
            if (err) { return utils.respondError(err, response); }  
            return utils.respondPlain(response, "Y");
        });
    });
}

function getNotes(request, response) {
    var currentGroup = utils.getViewingGroup(request);

    var getNotesQuery = "SELECT note_id, note_title, note_content, x, y " + 
                        "FROM note " +
                        "WHERE group_id='" + currentGroup + "' " +
                        "ORDER BY note_id";

    pg.connect(connectionString, function(err, client, done) {
        client.query(getNotesQuery, function(err, result) {
            done(client);
            if(err) { return utils.respondError(err, response); }
            
            var responseObjs = [];
            if(result.rows.length > 0) {
                for(var i = 0; i < result.rows.length; i++) {
                    var row = result.rows[i];
                    responseObjs.push({ noteId: row.note_id,
                                        noteTitle: row.note_title,
                                        noteContent: row.note_content,
                                        xCoord: row.x, 
                                        yCoord: row.y
                                      });
                }
            }
            response.end(JSON.stringify(responseObjs));
        });
    });
}


