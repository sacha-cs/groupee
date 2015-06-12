postHandler.addHandler("documents/upload_documents", uploadDocuments, false, {"multiples":true});
getHandler.addHandler("documents/get_documents", getDocuments);

function uploadDocuments(request, response, data, files) {
	var numFiles = files["upload[]"].length;
    var groupId = utils.getViewingGroup(request);

	var form = new FormData();

	form.append('groupId', groupId);
    if (files["upload[]"].name != '') {
    	if (!numFiles) {
    		numFiles = 1;
    	} else {
    			form.append('numFiles', numFiles);
    	}
    } else {
        fs.unlink(files["upload[]"].path);
        response.writeHead("303", {'Location' : '/documents/' });
        response.end();
    }

	for (var i = 0 ; i < numFiles ; i++) {
		(function(i) {
    		if (numFiles == 1) {
    			form.append(removeExtension(files["upload[]"].name), fs.createReadStream(files["upload[]"].path));
    		} else {
    			form.append(removeExtension(files["upload[]"][i].name), fs.createReadStream(files["upload[]"][i].path));
    		}
    		if (i == numFiles-1) {
			    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/uploadDocuments.php', function (err, res) {
			    	for (var i = 0 ; i < numFiles ; i++) {
			    		if (numFiles == 1) {
			        		fs.unlink(files["upload[]"].path);
			    		} else {
			    			fs.unlink(files["upload[]"][i].path);
			    		}
			    	}
			        response.writeHead("303", {'Location' : '/documents/' });
			        response.end();
		    	});
    		}
    	})(i); 
    }

}


function removeExtension(filename){
    var lastDotPosition = filename.lastIndexOf(".");
    if (lastDotPosition === -1) return filename;
    else return filename.substr(0, lastDotPosition);
}

function getDocuments(request, response, params) {
    var groupId = utils.getViewingGroup(request);
    var documents = '';

    var form = new FormData();
    form.append('group_id', groupId);
    form.submit('http://www.doc.ic.ac.uk/project/2014/271/g1427136/php/getDocuments.php', function (err, res) {
        res.on('data', function(chunk) {
            documents += chunk;
        });
        res.on('end', function() {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(documents);
        });
    });
}
