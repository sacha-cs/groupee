function addTodo() { 

	setSuccessText("");
	setErrorText("");
	
	var todoItem = document.getElementById("todo-item").value;

	if (todoItem == "") {
		setErrorText("Please enter a task");
	}

	var aClient = new HttpClient();
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
   	ev.stopPropagation();
   	var id = ev.dataTransfer.getData("text");
   	if (ev.fromParent) {
   		ev.target.children[1].appendChild(document.getElementById(id));
   	} else {	
   		ev.target.appendChild(document.getElementById(id));
   	}
   	var aClient = new HttpClient();
   	aClient.post('switch_to_todo', 'taskId=' + id,
   		function(response){});
}

function dropInDoing(ev) {
   	ev.preventDefault();
   	ev.stopPropagation();
   	var id = ev.dataTransfer.getData("text");
   	if (ev.fromParent) {
   		ev.target.children[1].appendChild(document.getElementById(id));
   	} else {	
   		ev.target.appendChild(document.getElementById(id));
   	}
   	var aClient = new HttpClient();
   	aClient.post('switch_to_doing', 'taskId=' + id,
   		function(response){});
}

function dropInDone(ev) {
   	ev.preventDefault();
   	ev.stopPropagation();
   	var id = ev.dataTransfer.getData("text");
   	if (ev.fromParent) {
   		ev.target.children[1].appendChild(document.getElementById(id));
   	} else {	
   		ev.target.appendChild(document.getElementById(id));
   	}
   	var aClient = new HttpClient();
   	aClient.post('switch_to_done', 'taskId=' + id,
   		function(response){});
}

function bubbleDrop(ev) {
	ev.preventDefault();
	ev.stopPropagation()
   	var data = ev.dataTransfer.getData("text");
   	ev.target.parentElement.appendChild(document.getElementById(data));
}

function dropToChild(ev) {
	ev.preventDefault();
	ev.stopPropagation();
	ev.fromParent = true;
   	ev.target.children[1].ondrop(ev);
}

function getAllTodoItems() {
	var todos = document.getElementById("todos");
	var doings = document.getElementById("doings");
	var dones = document.getElementById("dones");

	var aClient = new HttpClient();
	aClient.get('get_todos', function(response) {
		var todoItemList = response.split("#");
		for (var i = 0 ; i < todoItemList.length-1 ; i++) {
			var todoItem = todoItemList[i].split("&");
			var taskCategoryInfo = todoItem[0];
			var taskInfo = todoItem[1];
			var taskIdInfo = todoItem[2];
            var info = {category : escapeHtml(decodeURIComponent(taskCategoryInfo.split("=")[1])),
            	        task : escapeHtml(decodeURIComponent(taskInfo.split("=")[1])),   
                        taskId : taskIdInfo.split("=")[1]};

            var taskHtml = "<div draggable='true' ondragstart='drag(event)' ondrop='bubbleDrop(event)' class='task' id='" + info.taskId + "'>" +
            				info.task +
            			   "</div>";

           	switch(info.category) {
           		case "todo" :
           			todos.innerHTML += taskHtml;
           			break;
           		case "doing" :
           			doings.innerHTML += taskHtml;
           			break;
           		case "done" :
           			dones.innerHTML += taskHtml;
           			break;
           	}
		}
	});
}