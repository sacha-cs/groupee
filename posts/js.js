var noteInfo = [];
var delImgStr = 'http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png';
var movImgStr = 'http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/move.png';
var lastId = 0;
var ensureSent = false;
var offsetData;
var lastMoved = -1;

// BUG:  New notes moved and then data entered end up in corner on refresh.
// BUG:  Colours change on refresh.

// Gets note html
function getNoteHtml(id, title, content) {
    var html = "";
    if (!(title || content)) {
        html = "<li id='note" + id + "' ondrop='drop(event)'>" + 
                   "<textarea class='note-title' onblur='sendUpdate(" + id + ")' id='title" + id + "' placeholder='Untitled'></textarea>" +
                   "<textarea class='note-content' onblur='sendUpdate(" + id + ")' id='content" + id + "' placeholder='Your content here'></textarea>" +
                   "<div id='note-controller" + id + "'>" + 
                       "<img onclick='deleteNote(" + id + ")' id='delete' src='" + delImgStr + "'>" + 
                       "<img id='move" + id + "' ondragstart=drag(event) src='" + movImgStr + "'>" +
                   "</div>" +
               "</li>";
    } else {
        html = "<li id='note" + id + "' ondrop='drop(event)'>" + 
                   "<textarea class='note-title' onblur='sendUpdate(" + id + ")' id='title" + id + "' placeholder='Untitled'>" + title + "</textarea>" +
                   "<textarea class='note-content' onblur='sendUpdate(" + id + ")' id='content" + id + "' placeholder='Your content here'>" + content + "</textarea>" +
                   "<div id='note-controller" + id + "'>" + 
                       "<img onclick='deleteNote(" + id + ")' id='delete' src='" + delImgStr + "'>" + 
                       "<img id='move" + id + "' ondragstart=drag(event) src='" + movImgStr + "'>" +
                   "</div>" +
               "</li>";
    }
    return html;
}

function getColour() {
    var cols = ["#cfc", "#ccf", "#ffc"];
    var index = Math.floor(Math.random() * 3);
    return cols[index];
}

// Adds a new note.
function addNote() {
    var notes = document.getElementById("notes"); 
    var newColour = getColour();

    // Create an empty note.
    notes.innerHTML += getNoteHtml(lastId, null, null);
    noteInfo[lastId] = {noteId: -1, title: "", content: "", saved: false, colour: newColour};
    lastId++;

    // Iterate through all notes, set their values and re-add the 'lost' event listeners. 
    var noteLength = notes.children.length;
    for (var i = 0; i < noteLength; i++) {
        var currentId = parseInt(notes.children[i].id.slice(4));

        // Strings are immutable in Javascript, so the whole HTML string is written over! 
        document.getElementById("title" + currentId).value = noteInfo[currentId].title;
        document.getElementById("content" + currentId).value = noteInfo[currentId].content;
        document.getElementById("note" + currentId).style.background = noteInfo[currentId].colour;
    }
}

// Handles the saving of a note to the DB / altering an existing note.
function sendUpdate(id) {
    
    var expectedTitle = noteInfo[id].title;
    var expectedContent = noteInfo[id].content; 

    var actualTitle = document.getElementById("title" + id).value;
    var actualContent = document.getElementById("content" + id).value;
    var xCoord = document.getElementById("note" + id).style.left;
    var yCoord = document.getElementById("note" + id).style.top;

    var data = {noteTitle: actualTitle, noteContent: actualContent, noteId: -1, x:xCoord, y:yCoord};

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
            var colour = getColour();
            noteInfo[lastId] = {noteId: currentNote.noteId,
                                title: currentNote.noteTitle,
                                content: currentNote.noteContent,
                                saved: true,   
                                colour: colour}; 
            notes.innerHTML += getNoteHtml(lastId, currentNote.noteTitle, currentNote.noteContent);
            document.getElementById('note' + lastId).style.left = currentNote.xCoord;
            document.getElementById('note' + lastId).style.top = currentNote.yCoord;
            document.getElementById('note' + lastId).style.background = colour;
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
    var content = document.getElementById("content"); 
    content.addEventListener("drop", drop);
    content.addEventListener("dragover", allowDrop);
    inNotesPage = true;
}

function allowDrop(ev) {
    ev.preventDefault();
}

// Get the offset between where the user clicked on the element and the top left corner.
function drag(ev) {
    // TODO: Make whole note draggable. 
    var element = ev.target.parentElement.parentElement;
    lastMoved = element.id.slice(4);
    var style = window.getComputedStyle(ev.target.parentElement.parentElement, null);
    offsetData = (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + 
                 (parseInt(style.getPropertyValue("top"),10) - event.clientY);
    ev.dataTransfer.setData("text/plain", offsetData);
}

// Unpack the offsets and use them to position the element relative to the mouse pointer.
function drop(ev) {
    var offset = ev.dataTransfer.getData("text/plain").split(',');
    var dm = document.getElementById("move" + lastMoved).parentElement.parentElement;
    var xCoord = ev.clientX + parseInt(offset[0],10);
    var yCoord = ev.clientY + parseInt(offset[1],10);
    var id = noteInfo[lastMoved].noteId;
    dm.style.left = xCoord + 'px';
    dm.style.top = yCoord + 'px';
    
    var data = {x: xCoord, y: yCoord, noteId: id};
   
    // Save the new coordinates of the note in the database.
    if (id != -1) {
        var aClient = new HttpClient();
        aClient.post('update_note', JSON.stringify(data),
            function(response) {
                var correct = response[0];
                if (correct == "N") {
                    // TODO: Handle errors.
                }
            }
        );
    }
    ev.preventDefault();
}


