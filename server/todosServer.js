postHandler.addHandler("todos/add_todo", addTodoItem);
getHandler.addHandler("todos/get_todos", getTodoItems);

function addTodoItem(request, response, params) {
	if (!params.todoItem) {
		return utils.respondPlain(response, "NEmptyFields");
	}

	pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err ,response); }

		var group_id = utils.getViewingGroup(request);
		var username = utils.getUser(request);
		
		var insertTodoQuery = "INSERT INTO todos(group_id, item, category, created_by) " +
							  "VALUES(" + group_id + ", '" + 
							  	params.todoItem + "', 'todo', '" 
							  	+ username + "') RETURNING task_id";  

		client.query(insertTodoQuery, function(err, insertTodoResult) {
			done(client);
			var taskId = insertTodoResult.rows[0].task_id;
			if (err) { return utils.respondError(err, response); }

			return utils.respondPlain(response, "Y" + taskId);
		})
	})
}

function getTodoItems(request, response, params) {

	var group_id = utils.getViewingGroup(request);
	var getGroupQuery = "SELECT item, task_id " +
						"FROM todos " + 
						"WHERE group_id='" + group_id + "' AND " +
						"category='todo'";

	pg.connect(connectionString, function(err, client, done) {
		client.query(getGroupQuery, function(err, result) {
			done(client);
			if(err) { return utils.respondError(err, response); }
			
			var responseString = "";

			if (result.rows.length > 0) {
				for (var i = 0 ; i < result.rows.length ; i++) {
					var row = result.rows[i];
					var item = encodeURIComponent(row.item);
					var task_id = row.task_id;
					responseString += "item=" + item +  "&task_id=" + task_id + "#";
				}
			}

			response.write(responseString);
			response.end();
	
		});
	});
}
