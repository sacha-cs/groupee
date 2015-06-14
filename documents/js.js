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
    		var documentType = documentName.substr(documentName.lastIndexOf('.') + 1);
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
            			   "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png' onclick=\"deleteDocument('" + documentName + "')\">" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;

        case "ppt" :
        case "pptx" :
			documentHtml = "<div class='ppt' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/powerpoint-doc.png'>" +
            			   "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png' onclick=\"deleteDocument('" + documentName + "')\">" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;
        	
        case "doc" :
        case "docx" :
			documentHtml = "<div class='doc' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/word-doc.png'>" +
            			   "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png' onclick=\"deleteDocument('" + documentName + "')\">" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;

        case "xls" :
        case "xlsx" :
			documentHtml = "<div class='excel' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/excel-doc.png'>" +
            			   "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png' onclick=\"deleteDocument('" + documentName + "')\">" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;	

        case "txt" :
			documentHtml = "<div class='text' onclick=\"renderDocument('" + documentName + "')\">" + 
            			   "<img src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/plain-text-doc.png'>" +
            			   "<img class='delete' src='http://www.doc.ic.ac.uk/project/2014/271/g1427136/icons/delete.png' onclick=\"deleteDocument('" + documentName + "')\">" +
            			   "<p>" + documentName + "</p>" +
        				   "</div>";
        	break;
	}

	return documentHtml;
}

function renderDocument(documentName) {
	var documentViewer = document.getElementById("documents-viewer");
    var aClient = new HttpClient();
    aClient.get('get_group_id', function(groupId) {
	    documentViewer.innerHTML = "<iframe src='http://docs.google.com/gview?url=http://www.doc.ic.ac.uk/project/2014/271/g1427136/groups/group" + groupId + "/documents/" + documentName + "&embedded=true' frameborder='0'></iframe>";
    });
}

function deleteDocument(documentName) {
	var aClient = new HttpClient();
	aClient.post('delete_document', 'documentName=' + documentName, function(response) {
		location.reload(true);
	});
	event.stopPropagation();
}