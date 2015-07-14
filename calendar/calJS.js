var months = ['January', 'February', 'March', 'April', 'May', 'June', 
			  'July', 'August', 'September', 'October', 'November', 'December'];
var colors = ["#FF9D5C","#FF66CC","#6699FF", "#66CC00", "#CC0000", "#006600", "#330066"];
var colorIndex = 0;

var currDate = new Date(); // today's date
var currViewDate = currDate; // to know the current month that is displayed
var startEvent;
var endEvent;
var table;
var events;
var dragging;

function loaded() {
	table = document.getElementById("cal_table");
	for(var i=0; i<7; i++) {
		table.getElementsByTagName("TH")[i].style.verticalAlign = 'middle';
		table.getElementsByTagName("TH")[i].style.fontWeight = 'normal';
		table.children[0].children[i].style.background = "#657383";
		table.children[0].children[i].style.color = "#F5F5F5";
	}
	for(var i=0; i<7; i++) {
		for(var j=1; j<=6; j++) {
			table.children[j].children[i].onmouseup = addNewEvent;	
			table.children[j].children[i].onmousedown = startDrag;
			table.children[j].children[i].onmouseover = mouseOver;
			table.children[j].children[i].onmouseout = mouseOut;
		}
	}
	var client = new HttpClient();
	client.get("/calendar/calendar_update", function(response) {
		events = JSON.parse(response);
		getPresentMonth();	
	});
	dragging = false;
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
	for(var i=0; i<7; i++) {
		for(var j=1; j<=6; j++) {
			table.children[j].children[i].innerHTML = "";
			table.children[j].children[i].id = "";
			table.children[j].children[i].className = "date-box";			
		}
	}

	for(var i=1; i<=numOfDays; i++) {
		table.children[currRow].children[currCol].style.background = "#F5F5F5";
		table.children[currRow].children[currCol].innerHTML = "<div class='day-dates'>" + i + "</div>";
		table.children[currRow].children[currCol].id = i;

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
	for(var j=0; j<events.length; j++) {
		addEventToCalendar(events[j]);
	}
}

function addEventToCalendar(event) {
	var start_date = new Date(event.start_date);
	var end_date = new Date(event.end_date);
	var tooltipTime = formatTime(start_date, end_date);
	if (start_date.getMonth() == currViewDate.getMonth()) {
		for(var i = start_date.getDate(); i <= end_date.getDate(); i++) {
			document.getElementById(i).innerHTML += 
				"<div class='events' style='background-color:" + event.color +"'>" + escapeHtml(event.text) + 
				  "<span id='popover-time'>" + tooltipTime + "</span>" +
                  "<img onclick='deleteEvent(event, " + event.id + ")' onmouseup='doNothing(event)' id='delete' src='http://natpat.net/groupee/icons/delete.png'>" +
                "</div>";
		}
	}
}

function formatTime(start_date, end_date) {
	var startTime = prefixTime(start_date.getHours()) + ':' + prefixTime(start_date.getMinutes());
	var endTime = prefixTime(end_date.getHours()) + ':' + prefixTime(end_date.getMinutes());
	return startTime + ' - ' + endTime;
}

function prefixTime(time) {
	return (time < 10 ? ("0" + time) : time);
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

function startDrag(event) {
	dragging = true;
	var clickedDateBox = event.target;
	if(clickedDateBox.className != 'date-box') 
		clickedDateBox = clickedDateBox.parentNode;
	startEvent = parseInt(clickedDateBox.children[0].innerHTML);
}

function addNewEvent(event) {
	dragging = false;
	var clickedDateBox = event.target;
	if(clickedDateBox.className != 'date-box')
		clickedDateBox = clickedDateBox.parentNode;
	endEvent = parseInt(clickedDateBox.children[0].innerHTML);
	document.getElementById("new-event").style.visibility = "visible";
	document.getElementById("opacity-layer").style.visibility = "visible";
	resetBackgrounds();
}

function mouseOver(event) {
	if(!dragging)
		return;
	var dateBox = event.target;
	if(dateBox.className != 'date-box')
		dateBox = dateBox.parentNode;
	var date = parseInt(dateBox.children[0].innerHTML);
	if(!date)
		return;
	var startDate;
	var endDate;
	if(date > startEvent) {
		startDate = startEvent;
		endDate = date;
	} else {
		startDate = date;
		endDate = startEvent;
	}
	for(var i = startDate; i <= endDate; i++) {
		document.getElementById("" + i).style.background = "#98AFC7";
	}
}

function mouseOut(event) { 
	//this is the original element the event handler was assigned to
    var e = event.toElement || event.relatedTarget;
    if (e.parentNode == this || e == this) {
       return;
    }
	if(!dragging)
		return;
	resetBackgrounds();
}

function resetBackgrounds() {
	for(var i = 1; i <= 31; i++) {
		if(i == currDate.getDate() && currViewDate.getMonth() == currDate.getMonth() &&
		   currViewDate.getFullYear() == currDate.getFullYear())
			document.getElementById("" + i).style.background = "#FFCC66";
		else
			document.getElementById("" + i).style.background = "#F5F5F5";
	}
}

function hideNewEvent() {
	document.getElementById("new-event").style.visibility = "hidden";
	document.getElementById("opacity-layer").style.visibility = "hidden";
}

function submitEvent() {
	var text = document.getElementById("event-item").value;
	var startTime = document.getElementById("start-time").value;
	var endTime = document.getElementById("end-time").value;



	var startHour = startTime.substring(0,startTime.indexOf(":"));
	var startMinute = startTime.substring(startTime.lastIndexOf(":")+1);

	var endHour = endTime.substring(0,endTime.indexOf(":"));
	var endMinute = endTime.substring(endTime.lastIndexOf(":")+1);


	if (startEvent > endEvent) {
		var temp = startEvent;
		startEvent = endEvent;
		endEvent = temp;
	}
	
	var month = (currViewDate.getMonth()+1);
	month = (month < 10 ? ("0") : "") + month;

	var startString = (startEvent < 10? "0" : "") + startEvent;
	var endString = (endEvent < 10? "0" : "") + endEvent;

	var startDate = "" + currViewDate.getFullYear() + "-" + month + "-" + 
				 startString + "T" + startHour + ":" + startMinute + ":00";  
	var endDate = "" + currViewDate.getFullYear() + "-" + month + "-" + 
				endString + "T" + endHour + ":" + endMinute + ":00";

	var color = colors[colorIndex];
	colorIndex = (colorIndex + 1) % colors.length;

	var payload = {
		text: text,
		start_date: startDate,
		end_date: endDate,
		color: color
	}

	var client = new HttpClient();

	client.post("/calendar/post_event", JSON.stringify(payload), function() {
	});
	addEventToCalendar(payload);
	hideNewEvent();
}


function deleteEvent(clickEvent, eventId) {
	clickEvent.stopPropagation();
	var aClient = new HttpClient();
	aClient.post('delete_event', 'id=' + eventId,
	  function(response){
	    if (response[0] == "Y") {
	      var deletedEvent = document.getElementById(eventId);
	      // This line doesn't work... so commented out
	      // deletedEvent.parentNode.removeChild(deletedEvent);
	      location.reload(true);
	    }
	  });
	addEventToCalendar(payload);
}

function doNothing(e) {
	e.stopPropagation();
}