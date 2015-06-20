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
    var x = parsedData.x ? parseInt(parsedData.x, 10) : 50;
    var y = parsedData.y ? parseInt(parsedData.y, 10) : 60;
    var colour = parsedData.colour;

    var insertNoteQuery = "INSERT INTO note(note_title, note_content, group_id, username, x, y, colour) " +
                          "VALUES('" + noteTitle + "', '" + noteContent + "', " + 
                                       groupId + ", '" + username + "', " + x + ", " + y + ", '" + colour + "') " + 
                          "RETURNING note_id"; 
	pg.connect(connectionString, function(err, client, done) {
	 	client.query(insertNoteQuery, function(err, result) {
            done(client);
			var noteId = result.rows[0].note_id;
			if (err) { return utils.respondError(err, response); }
            return utils.respondPlain(response, "Y" + noteId);
		});
	});
    
    notificationServer.checkForNotification(noteTitle, username, groupId, "posts"); 
    notificationServer.checkForNotification(noteContent, username, groupId, "posts"); 
}

// Update a note with a given id.
function updateNote(request, response, data) {
    var parsedData = JSON.parse(data);
    var id = parsedData.noteId;
    var title = parsedData.noteTitle;
    var content = parsedData.noteContent;
    var x = parseInt(parsedData.x, 10);
    var y = parseInt(parsedData.y, 10);
    var toUpdate = [];
    
    if (title) toUpdate.push("note_title='" + title + "'");
    if (content) toUpdate.push("note_content='" + content + "'");
    if (x) toUpdate.push("x=" + x);
    if (y) toUpdate.push("y=" + y + " ");

    if (toUpdate.length > 0) {
        var updateNoteQuery = 
            "UPDATE note " +
            "SET " + toUpdate.join(', ') +
            "WHERE note_id=" + id;
        pg.connect(connectionString, function(err, client, done) {
            client.query(updateNoteQuery, function(err, result) {
                done(client);
                if (err) { return utils.respondError(err, response); }
                return utils.respondPlain(response, "Y");
            });
        });
        var username = utils.getUser(request);
        var groupId = utils.getViewingGroup(request);
        notificationServer.checkForNotification(title, username, groupId, "posts"); 
        notificationServer.checkForNotification(content, username, groupId, "posts"); 
    }
}

// Deletes a given note from the DB.
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

// Gets information about all existing notes for the current group from the database.  
function getNotes(request, response) {
    var currentGroup = utils.getViewingGroup(request);

    var getNotesQuery = "SELECT note_id, note_title, note_content, x, y, colour " + 
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
                    responseObjs.push({ 
                        noteId: row.note_id,
                        noteTitle: row.note_title,
                        noteContent: row.note_content,
                        xCoord: row.x, 
                        yCoord: row.y,
                        colour: row.colour
                    });
                }
            }
            response.end(JSON.stringify(responseObjs));
        });
    });
}


