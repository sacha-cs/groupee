function addTodo() { 

	setSuccessText("");
	setErrorText("");
	
	var todoItem = document.getElementById("todo-item").value;

	if (todoItem == "") {
		setErrorText("Please enter a task");
	}

	aClient = new HttpClient();
	aClient.post('add_todo', 'todoItem=' + todoItem, 
		function(response) {
			var correct = response[0];
			if (correct == "Y") {
				document.getElementById("todo-item").value = "";
				setSuccessText("Item added successfully");
				return;
			} else {
				setErrorText("Please enter a task");
				return;
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