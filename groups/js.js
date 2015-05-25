
function loaded() {


	var dd = new DropDown( document.getElementById("dd") );

	document.getElementsByClassName("wrapper-dropdown")[0].addEventListener('click', function(event){
		/*console.log("clicked");
		if(this.className == "wrapper-dropdown") {
			this.className = "wrapper-dropdown active"
		} else {
			this.className = "wrapper-dropdown"
		}
		return false;*/
	});

	document.addEventListener("click", function() {
		document.getElementsByClassName('wrapper-dropdown')[0].className = 'wrapper-dropdown';
		console.log("reset");
	});

}

function DropDown(el) {
    this.dd = el;
    this.initEvents();
} 
DropDown.prototype = {
    initEvents : function() {
        var obj = this;

        obj.dd.addEventListener('click', function(event){
        	/*getElementByClassName('wrapper-dropdown')[0].className = 'wrapper-dropdown';
	        this.toggleClass('active');*/
			console.log("dd");
			if(this.className == "wrapper-dropdown") {
				this.className = "wrapper-dropdown active"
			} else {
				this.className = "wrapper-dropdown"
			}
	        event.stopPropagation();
        }); 
    }
}