var noteInfo = [];
var imgStr = 'http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png';
var lastId = 0;
var ensureSent = false;

// Adds a new note.
function addNote() {
    var notes = document.getElementById("notes"); 
    var noteLength = notes.children.length;

    // Create an empty note.
    notes.innerHTML += "<li id='note" + lastId + "'>" + 
                           "<textarea class='note-title' onblur='sendUpdate(" + lastId + ")' maxlength='10' id='title" + lastId + "' placeholder='Untitled'></textarea>" +
                           "<textarea class='note-content' onblur='sendUpdate(" + lastId + ")' id='content" + lastId + "' placeholder='Your content here'></textarea>" +
                           "<img onclick='deleteNote(" + lastId + ")' id='delete' src='" + imgStr + "'>" +
                       "</li>";
    noteInfo[lastId] = {noteId: -1, title: "", content: "", saved: false};
    lastId++;

    // Iterate through all notes, set their values and re-add the 'lost' event listeners. 
    for (var i = 0; i < noteLength; i++) {
        var currentId = parseInt(notes.children[i].id.slice(4));

        // Strings are immutable in Javascript, so the whole HTML string is written over! 
        document.getElementById("title" + currentId).value = noteInfo[currentId].title;
        document.getElementById("content" + currentId).value = noteInfo[currentId].content; 
    }
}

// Handles the saving of a note to the DB / altering an existing note.
function sendUpdate(id) {
    
    var expectedTitle = noteInfo[id].title;
    var expectedContent = noteInfo[id].content; 

    var actualTitle = document.getElementById("title" + id).value;
    var actualContent = document.getElementById("content" + id).value;

    var data = {noteTitle: actualTitle, noteContent: actualContent, noteId: -1};

    // We don't want to do anything if there are no changed that have been made to the note. 
    if (expectedTitle == actualTitle && expectedContent == actualContent) {
        return;
    }

    // Otherwise, something is different, so we can send some data. 

    // We pass ensureSent into HttpClient to ensure that the update has finished before
    // continuing, which is useful for updating the note a user is currently focused on 
    // during a page refresh,
    var aClient = new HttpClient(ensureSent);
    if (noteInfo[id].saved) {
        // Update the note with the given id.
        data.noteId = noteInfo[id].noteId;
        aClient.post('update_note', JSON.stringify(data),
            function(response) {
                var correct = response[0];
                if (correct == "N") {
                    // TODO: Handle errors.
                }
            }
        );
    } else {
        // Save to the database.
        aClient.post('add_note', JSON.stringify(data), 
            function(response) {
                var correct = response[0];
                if (correct == "Y") {
                    var newId = response.slice(1); // Id of note that we have saved to.
                    noteInfo[id].saved = true;
                    noteInfo[id].noteId = newId;
                } else {
                    // TODO: Handle errors. 
                }
            }
        );
    }

    // Record updates locally. 
    noteInfo[id].title = actualTitle;
    noteInfo[id].content = actualContent;
}

function setErrorText(error) {
    document.getElementById("error").innerHTML = error;
    return;
}

function getNotes() {
    return document.getElementById("notes");
}

// Delete a note associated with a user from the database.
function deleteNote(id) {
    var aClient = new HttpClient();
    var actualId = noteInfo[id].noteId;
    var data = {noteId: actualId};

    // Clear the value for the note in local storage.
    delete noteInfo[id];
    
    var noteForDeletion = document.getElementById("note" + id);
    noteForDeletion.parentElement.removeChild(noteForDeletion);
    
    // We only want DB interactions for entries that exist in the DB.
    if (actualId != -1) {
        aClient.post('delete_note', JSON.stringify(data),
            function (response) {
                if (response[0] == "N") {
                    // TODO: Handle errors.
                }
            }
        );
    }
}

// Sends a request to the server to receive all notes associated with a group.
function getAllNotes() {
	var notes = document.getElementById("notes"); 
	var aClient = new HttpClient();
	aClient.get('get_notes', function(response) {
		var noteList = JSON.parse(response);
		for (var i = 0; i < noteList.length ; i++) {
            var currentNote = noteList[i];
            noteInfo[lastId] = {noteId: currentNote.noteId,
                                title: currentNote.noteTitle,
                                content: currentNote.noteContent,
                                saved: true}; 

            notes.innerHTML += "<li id='note" + lastId + "'>" + 
                                   "<textarea class='note-title' maxlength='10' onblur='sendUpdate(" + lastId + ")' id='title" + lastId + "' placeholder='Untitled'>" + currentNote.noteTitle + "</textarea>" +
                                   "<textarea class='note-content' onblur='sendUpdate(" + lastId + ")' id='content" + lastId + "' placeholder='Your content here'>" + currentNote.noteContent + "</textarea>" +
                                   "<img onclick='deleteNote(" + lastId + ")' id='delete' src='" + imgStr + "'>" +
                               "</li>";

            lastId++;
    	}
	});
}

window.onbeforeunload = function() {
    var el = document.activeElement;
    if (el && (el.tagName.toLowerCase() == 'textarea')) {
        // Element currently in focus is a textarea.
        var id = el.parentElement.id.slice(4);
        ensureSent = true;
        sendUpdate(id);
    }
}

function loaded() {
    getAllNotes();
}
