var noteInfo = [];
var lastId = 0;

// Adds a new note.
function addNote() {
    var notes = document.getElementById("notes"); 
    var noteLength = notes.children.length;

    // Create an empty note.
    notes.innerHTML += "<li>" + 
                          "<a href='#' id='note" + lastId + "'>" +
                              "<textarea class='note-title' id='title" + lastId + "' placeholder='Untitled'></textarea>" +
                              "<textarea class='note-content' id='content" + lastId + "' placeholder='Your content here'></textarea>" +
                          "</a> " +
                      "</li>";
    
    // "onblur" event checks when the user leaves a text field - add listeners.
    document.getElementById("title" + lastId).addEventListener("blur", sendUpdate);
    document.getElementById("content" + lastId).addEventListener("blur", sendUpdate);
        
    noteInfo[lastId] = {noteId: -1, title: "", content: "", saved: false};
    lastId++;

    // Iterate through all notes, set their values and re-add the 'lost' event listeners. 
    for (var i = 0; i < noteLength; i++) {
        var currentId = parseInt(notes.children[i].children[0].id.slice(4));
        document.getElementById("title" + currentId).value = noteInfo[currentId].title;
        document.getElementById("content" + currentId).value = noteInfo[currentId].content;
        
        // Strings are immutable in Javascript, so the whole HTML string is written over! 
        document.getElementById("title" + currentId).addEventListener("blur", sendUpdate);
        document.getElementById("content" + currentId).addEventListener("blur", sendUpdate);
    }
}

// Handles the saving of a note to the DB / altering an existing note.
function sendUpdate(e) {
    var id = e.target.parentElement.id.slice(4); // Id of note we just clicked away from.

    var expectedTitle = noteInfo[id].title;
    var expectedContent = noteInfo[id].content; 

    var actualTitle = document.getElementById("title" + id).value;
    var actualContent = document.getElementById("content" + id).value;

    var data = {noteTitle: actualTitle, noteContent: actualContent, noteId: 2129};

    // We don't want to do anything if there are no changed that have been made to the note. 
    if (expectedTitle == actualTitle && expectedContent == actualContent) {
        return;
    }
    // Something is different, so we can send some data. 
    var aClient = new HttpClient();
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

function getAllNotes() {/*
	var notes = document.getElementById("notes"); 
	var aClient = new HttpClient();
	aClient.get('get_notes', function(response) {
		var noteList = response.split("#");
		for (var i = 0; i < noteList.length-1 ; i++) {
			var noteInfo = noteList[i].split("&");
            var noteId = noteInfo[0].split("=")[1];
            var noteTitle = noteInfo[1].split("=")[1];
            var noteContent = noteInfo[2].split("=")[1];
            var info = {noteId : noteId,
            	        noteTitle : escapeHtml(decodeURIComponent(noteTitle)),   
                        noteContent : escapeHtml(decodeURIComponent(noteContent))};
            noteHtml = "<li id='" + info.noteId + "'>" +
                           "<a href='#'>" +
                                "<textarea class='note-title' maxlength='10'>" + info.noteTitle + "</textarea>" +
                                "<textarea class='note-content'>" + info.noteContent + "</textarea>" +
                            "</a>" +
                       "</li>";
            notes.innerHtml += noteHtml;
    	}
	}); */
}

