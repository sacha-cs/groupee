function loaded() {
	getAllDocuments();
}

function popupForm() {
	document.getElementById("opacity-layer").style.visibility = 'visible';
	document.getElementById("form-wrapper").style.display = 'initial';
    event.stopPropagation();
}

function hideForm() {
	document.getElementById("opacity-layer").style.visibility = 'hidden';
	document.getElementById("form-wrapper").style.display = 'none';
}

function getAllDocuments() {
	var aClient = new HttpClient();
    aClient.get('get_documents', function(response) {

    	var documents = JSON.parse(response);
    	
    	for (var key in documents) {
    		var documentName = documents[key];
    		var documentType = documentName.slice(-3);
    		var documentsList = document.getElementById("documents-list");
    		var documentHtml = addDocument(documentName, documentType);
    		documentsList.innerHTML += documentHtml;
    	}
    })
}

function addDocument(documentName, documentType) {
	var documentHtml;

	switch (documentType) {
		case "pdf" :
			documentHtml = "<div class='pdf' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/pdf-doc.png'>" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;

        case "ppt" :
			documentHtml = "<div class='ppt' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/powerpoint-doc.png'>" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;
        	
        case "doc" :
			documentHtml = "<div class='doc' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/word-doc.png'>" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;

        case "xls" :
			documentHtml = "<div class='excel' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/excel-doc.png'>" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;	

        case "txt" :
			documentHtml = "<div class='text' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/plain-text-doc.png'>" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;
	}

	return documentHtml;
}

function renderDocument(documentName) {
	var documentViewer = document.getElementById("documents-viewer");
	documentViewer.innerHTML = "<iframe src='http://docs.google.com/gview?url=http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group120/documents/" + documentName + "&embedded=true' frameborder='0'></iframe>";
}

