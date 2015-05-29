function addNote() {
    var notes = document.getElementById("notes");
    /* Save the last note the the database. */
    var aClient = new HttpClient();
    var noteLength = notes.children.length;
    var lastNote = notes.children[noteLength - 1]; // The last note in the list.
    var noteTitle = lastNote.children[0].children[0].value;
    var noteContent = lastNote.children[0].children[1].value;
    
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
                                    "</a> "
                               "</li>";
                notes.innerHTML += noteHtml;
			} else {
                /* Force user to have at least a title/content so there are not empty entries in DB. */    
            }
        }
    );
}

