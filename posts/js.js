function addNote() {
    var notes = document.getElementById("notes");
    var noteHtml = "<li>" + 
                        "<a href='#'>" +
                            "<textarea class='note-title' maxlength='10' placeholder='Untitled'>" +
                            "</textarea>" +
                            "<textarea class='note-content' placeholder='Your content here'/>" +
                            "</textarea>" +
                        "</a> "
                   "</li>";
    notes.innerHTML += noteHtml;
}
