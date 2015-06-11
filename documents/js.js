function loaded() {

}

function popupForm() {
	document.getElementById("opacity-layer").style.visibility = 'visible';
	document.getElementById("form-wrapper").style.display = 'initial';
    event.stopPropagation();
}

function hideForm() {
	document.getElementById("opacity-layer").style.visibility = 'hidden';
	document.getElementById("form-wrapper").style.display = 'none';
}