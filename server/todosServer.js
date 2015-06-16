postHandler.addHandler("todos/add_todo", addTodoItem);
getHandler.addHandler("todos/get_todos", getTodoItems);
postHandler.addHandler("todos/switch_to_doing", switchToDoing);
postHandler.addHandler("todos/switch_to_todo", switchToTodo);
postHandler.addHandler("todos/switch_to_done", switchToDone);
postHandler.addHandler("todos/delete_todo", deleteTodoItem);

function addTodoItem(request, response, params) {
	if (!params.todoItem) {
		return utils.respondPlain(response, "NEmptyFields");
	}

    var group_id = utils.getViewingGroup(request);
    var username = utils.getUser(request);
	pg.connect(connectionString, function(err, client, done) {
		if(err) { return utils.respondError(err ,response); }

		var task = params.todoItem.replace("'", "''")

		var insertTodoQuery = "INSERT INTO todos(group_id, item, category, created_by) " +
							  "VALUES(" + group_id + ", '" + 
							  	task + "', 'todo', '" 
							  	+ username + "') RETURNING task_id";  

		client.query(insertTodoQuery, function(err, insertTodoResult) {
			done(client);
			var taskId = insertTodoResult.rows[0].task_id;
			if (err) { return utils.respondError(err, response); }

			return utils.respondPlain(response, "Y" + taskId);
		})
	})
    notificationServer.checkForNotification(params.todoItem, username, group_id, "todos"); 

}

function getTodoItems(request, response, params) {

	var group_id = utils.getViewingGroup(request);
	var getGroupQuery = "SELECT item, category, task_id " +
						"FROM todos " + 
						"WHERE group_id='" + group_id + "'";

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
					var category = encodeURIComponent(row.category);
					responseString += "category=" + category +
									  "&item=" + item +  
									  "&task_id=" + task_id + "#";
				}
			}

			response.write(responseString);
			response.end();
	
		});
	});
}

function switchToDoing(request, response, params) {
	var task_id = params.taskId;
	var switchToDoingQuery = "UPDATE todos " +
							 "SET category='doing' " +
							 "WHERE task_id=" + task_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(switchToDoingQuery, function(err, result) {
			done(client);
			if (err) { return utils.respondError(err, response); }
			return utils.respondPlain(response, "Y");
		});
	});
}

function switchToTodo(request, response, params) {
	var task_id = params.taskId;
	var switchToTodoQuery = "UPDATE todos " +
							 "SET category='todo' " +
							 "WHERE task_id=" + task_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(switchToTodoQuery, function(err, result) {
			done(client);
			if (err) { return utils.respondError(err, response); }
			return utils.respondPlain(response, "Y");
		});
	});
}

function switchToDone(request, response, params) {
	var task_id = params.taskId;
	var switchToTodoQuery = "UPDATE todos " +
							 "SET category='done' " +
							 "WHERE task_id=" + task_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(switchToTodoQuery, function(err, result) {
			done(client);
			if (err) { return utils.respondError(err, response); }
			return utils.respondPlain(response, "Y");
		});
	});
}

function deleteTodoItem(request, response, params) {
	var task_id = params.taskId;
	var deleteTodoQuery = "DELETE FROM todos " +
						  "WHERE task_id=" + task_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(deleteTodoQuery, function(err, result) {
			done(client);
			if (err) { return utils.respondError(err, response); }
			return utils.respondPlain(response, "Y");			
		});
	});
}


