postHandler.addHandler("todos/add_todo", addTodoItem);

function addTodoItem(request, response, params) {
	if (!params.todoItem) {
		return utils.respondPlain(response, "NEmptyFields");
	}

	pg.connect(connectionString, function(err, client, done) {
		if(err) { return respondError(err); }

		var group_id = utils.getViewingGroup(request);
		var username = utils.getUser(request);
		
		var insertTodoQuery = "INSERT INTO todos(group_id, item, category, created_by) " +
							  "VALUES(" + group_id + ", '" + 
							  	params.todoItem + "', 'todo', '" 
							  	+ username + "')";  

		client.query(insertTodoQuery, function(err, insertTodoResult) {
			done(client);
			if (err) { return respondError(err); }

			return utils.respondPlain(response, "YItemAddedSuccessfully");
		})
	})
}
