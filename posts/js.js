function addNote() {
	var notes = document.getElementById("notes"); 
    /* Save the last note to the database. */
    var aClient = new HttpClient();
    var noteLength = notes.children.length;
    console.log(noteLength);

    if (noteLength == 0) {
        /* Create an empty note. */
        console.log("got here");
        notes.innerHtml += "<li>" + 
                              "<a href='#'>" +
                                  "<textarea class='note-title' maxlength='10' placeholder='Untitled'></textarea>" +
                                  "<textarea class='note-content' placeholder='Your content here'></textarea>" +
                              "</a> " +
                          "</li>";
        console.log(notes.innerHTML);
    } else {
        var lastNote = notes.children[noteLength - 1]; // The last note in the list.
        var noteTitle = lastNote.children[0].children[0].value;
        var noteContent = lastNote.children[0].children[1].value;
        
        setErrorText("");
        if (noteTitle == "" && noteContent == "") {
            console.log("both empty!");
            setErrorText("Do not create empty notes.");
            return;
        } 

        /* ?????????? HOW CAN I GET THIS TO WORK ????????? */
        lastNote.children[0].children[0].value = noteTitle;
        lastNote.children[0].children[1].value = noteContent;

        /* Send a request to save the last note to the database and add a fresh note to the list. */
        /* This however OBLITERATES THE REST OF THE LIST */
        aClient.post('add_note', 'noteTitle=' + noteTitle + '&noteContent=' + noteContent,
            function(response) {
                var correct = response[0];
                if (correct == "Y") {
                    var noteHtml = "<li>" + 
                                        "<a href='#'>" +
                                            "<textarea class='note-title' maxlength='10' placeholder='Untitled'></textarea>" +
                                            "<textarea class='note-content' placeholder='Your content here'></textarea>" +
                                        "</a>" +
                                   "</li>";
                    notes.innerHTML += noteHtml;
                } else {
                    /* Force user to have at least a title/content so there are not empty entries in DB. */    
                }
            }
        );
    }
}

function setErrorText(error) {
    document.getElementById("error").innerHTML = error;
    return;
}

function getNotes() {
    return document.getElementById("notes");
}

function getAllNotes() {
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
	}); 
}

