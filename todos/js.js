function addTodo() { 
	var todoItem = document.getElementById("todo-item").value;

	aClient = new HttpClient();
	aClient.post('add_todo', 'todoItem=' + todoItem, 
		function(response) {
			var correct = response[0];
			if (correct == "Y") {
				document.getElementById("todo-item").value = "";
				// TODO: tell the user it succeeded with setSuccessText
			} else {
				// TODO: tell the user it failed with setErrorText
			}
		});
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
   	ev.preventDefault();
   	var data = ev.dataTransfer.getData("text");
   	ev.target.appendChild(document.getElementById(data));
}