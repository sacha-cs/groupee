var months = ['January', 'February', 'March', 'April', 'May', 'June', 
			  'July', 'August', 'September', 'October', 'November', 'December'];

var currDate = new Date(); // today's date
var currViewDate = currDate;

function loaded() {
	getPresentMonth();
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
			table.children[currRow].children[currCol].style.background = "#C3D7DF";	
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