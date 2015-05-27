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
				document.getElementById("todos").innerHTML += 
							"<div draggable='true' ondragstart='drag(event)' class='task' id='" + response.slice(1) + "'>" +
            				 todoItem +
            			    "</div>";
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

function dropInTodo(ev) {
   	ev.preventDefault();
   	var data = ev.dataTransfer.getData("text");
   	ev.target.appendChild(document.getElementById(data));
}

function dropInDoing(ev) {
   	ev.preventDefault();
   	var data = ev.dataTransfer.getData("text");
   	ev.target.appendChild(document.getElementById(data));
}

function dropInDone(ev) {
   	ev.preventDefault();
   	var data = ev.dataTransfer.getData("text");
   	ev.target.appendChild(document.getElementById(data));
}

function bubbleDrop(ev) {
	ev.preventDefault();
	event.stopPropagation()

   	var data = ev.dataTransfer.getData("text");

   	ev.target.parentElement.appendChild(document.getElementById(data));
}

function getTodoItems() {
	var todos = document.getElementById("todos");

	var aClient = new HttpClient();
	aClient.get('get_todos', function(response) {
		var todoItemList = response.split("#");
		for (var i = 0 ; i < todoItemList.length-1 ; i++) {
			var todoItem = todoItemList[i].split("&");
			var taskInfo = todoItem[0];
			var taskIdInfo = todoItem[1];
            var info = {task : escapeHtml(decodeURIComponent(taskInfo.split("=")[1])),   
                        taskId : taskIdInfo.split("=")[1]};

            var taskHtml = "<div draggable='true' ondragstart='drag(event)' ondrop='bubbleDrop(event)' class='task' id='" + info.taskId + "'>" +
            				info.task +
            			   "</div>";

           	todos.innerHTML += taskHtml;
		}
	});
}