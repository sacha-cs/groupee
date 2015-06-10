var months = ['January', 'February', 'March', 'April', 'May', 'June', 
			  'July', 'August', 'September', 'October', 'November', 'December'];

var currDate = new Date(); // today's date
var currViewDate = currDate; // to know the current month that is displayed
var startEvent;
var endEvent;


function loaded() {
	var table = document.getElementById("cal_table");
	for(var i=0; i<7; i++) {
		table.children[0].children[i].style.background = "#657383";
		table.children[0].children[i].style.color = "white"
	}
	for(var i=0; i<7; i++) {
		for(var j=1; j<=6; j++) {
			table.children[j].children[i].onmouseup = addEvent;	
			table.children[j].children[i].onmousedown = startDrag;
		}
	}
	getPresentMonth();

	var client = new HttpClient();
	client.get("/calendar/calendar_update", function(response) {
		console.log("get event received");
		response = JSON.parse(response);
		console.log(response);
		for (var i=0; i<response.length; i++) {
			var start_date = new Date(response[i].start_date);
			var end_date = new Date(response[i].end_date);
			console.log(start_date.getMonth());
		}
	});


}

function daysInMonth(anyDateInMonth) {
    return new Date(anyDateInMonth.getYear(), 
                    anyDateInMonth.getMonth()+1, 
                    0).getDate();
}

function setMonthAndYear(currMonth, currYear) {
	// setting the current month and year 
	var date = document.getElementById("cal_date");
	date.innerHTML = " " + months[currMonth] + " " + currYear +" ";
}

function loadTheDates(numOfDays, currRow, currCol) {
	var table = document.getElementById("cal_table");

	for(var i=0; i<7; i++) {
		for(var j=1; j<=6; j++) {
			table.children[j].children[i].innerHTML = "";			
		}
	}

	for(var i=1; i<=numOfDays; i++) {
		table.children[currRow].children[currCol].innerHTML = i;
		table.children[currRow].children[currCol].style.background = "#F5F5F5";
		if ((i == currDate.getDate()) && (currDate.getMonth() == currViewDate.getMonth())
			&& (currDate.getYear() == currViewDate.getYear())) {
			table.children[currRow].children[currCol].style.background = "#FFCC66";	
		}
		currCol++;
		if (currCol == 7) {
			currRow++;
			currCol = 0;
		}
	}
}

function getNextMonth() {
	var nextMonth = currViewDate.getMonth()+1;
	var nextYear = currViewDate.getFullYear();
	if (nextMonth >= 12) {
		nextMonth = 0;
		nextYear = currViewDate.getFullYear()+1; 
	}
	currViewDate = new Date(nextYear, nextMonth, 1);
	setMonthAndYear(nextMonth, nextYear);
	var numOfDays = daysInMonth(currViewDate);
	var firstDay = currViewDate.getDay();
	loadTheDates(numOfDays, 1, firstDay);
} 

function getPrevMonth() {
	var prevMonth = currViewDate.getMonth()-1;
	var prevYear = currViewDate.getFullYear();
	if (prevMonth < 0) {
		prevMonth = 11;
		prevYear = prevYear - 1;
	}
	currViewDate = new Date(prevYear, prevMonth,1);
	setMonthAndYear(prevMonth, prevYear);
	var numOfDays = daysInMonth(currViewDate);
	var firstDay = currViewDate.getDay();
	loadTheDates(numOfDays, 1, firstDay);
}

function getPresentMonth() {
	currViewDate = currDate;
	var currYear = currDate.getFullYear();
	var currMonth = currDate.getMonth();	
	var firstDay = (new Date(currYear, currMonth, 1)).getDay();
	var numOfDays = daysInMonth(currDate);

	setMonthAndYear(currMonth, currYear);
	loadTheDates(numOfDays, 1, firstDay);
}

function addEvent(event) {
	endEvent = event.target.innerHTML;
	console.log(endEvent);
	document.getElementById("new-event").style.visibility = "visible";
	document.getElementById("opacity-layer").style.visibility = "visible";
}

function startDrag(event) {
	console.log(event);
	startEvent = event.target.innerHTML;
}

function hideNewEvent() {
	document.getElementById("new-event").style.visibility = "hidden";
	document.getElementById("opacity-layer").style.visibility = "hidden";
}

function submitEvent() {
	var text = document.getElementById("event-item").value;
	var startDate = "" + startEvent + "/" + (currViewDate.getMonth()+1) + "/" + 
					currViewDate.getFullYear() + " 00:00:00";  
	var endDate = "" + endEvent + "/" + (currViewDate.getMonth()+1) + "/" + 
					currViewDate.getFullYear() + " 00:00:00";
	var color = "#FF0000";

	var payload = {
		text: text,
		start_date: startDate,
		end_date: endDate,
		color: color
	}

	var client = new HttpClient();

	client.post("/calendar/post_event", JSON.stringify(payload), function() {
		console.log("post event received");
	});
	hideNewEvent();
}