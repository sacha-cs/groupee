//The canvases - the permenent and temporary
var canvas;
var ctx;
var tempCanvas;
var tempCtx;

//The hidden text input that is used for text input.
var textHidden;

var mouseDown = false;
var started = false;
var last;
var userPen;
var tool;
var addingText;
var textPos;
var showCursor;

var cursorInterval = setInterval(function() { 
    showCursor = !showCursor;
    if(tool=="Text" && document.activeElement == textHidden)
        drawTextTemp(null, true);
     }, 500);

function startWhiteboard() {
    //Get the canvas and the context so we can draw stuff!
    canvas = document.getElementById("board");
    if(canvas.getContext) {
        ctx = canvas.getContext('2d');
    }
    tempCanvas = document.getElementById("tempBoard");
    if(tempCanvas.getContext)
        tempCtx = tempCanvas.getContext('2d');
    textHidden = document.getElementById("textHidden");

    userPen = {colour: "rgb(255, 0, 0)", 
               thickness:3, 
               fillColour: "rgb(0, 0, 0)",
               textSize: 20};
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    addingText = false;

    tool = "Pen";

    tempCanvas.addEventListener('mousemove', function(evt) {
        mousePos = getMousePos(canvas, evt);
        if(tool == "Pen") {
            tempCtx.clearRect(0, 0, canvas.width, canvas.height);
            tempCtx.fillStyle = userPen.colour;
            tempCtx.strokeStyle = "black";
            tempCtx.lineWidth = 1;
            drawCircle(tempCtx, mousePos, userPen.thickness/2);
            drawCircleOutline(tempCtx, mousePos, userPen.thickness/2);
            if(mouseDown) {
                if(!started) {
                    started = true;
                    last = mousePos;
                }
                ctx.strokeStyle = userPen.colour;
                ctx.lineWidth = userPen.thickness;
                ctx.beginPath();
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.stroke();
                last = mousePos;
            }
        }

            
    });
    tempCanvas.addEventListener("mousedown", function() {
        mouseDown = true;
        if(tool == "Text") {
            if(started)
                drawTextPermenent();
            textPos = mousePos;
            setTimeout(function () { textHidden.focus() }, 100);
            textHidden.value = "";
        }

    });
    tempCanvas.addEventListener("mouseup", function(evt) {
        mouseDown = false;
        if(tool != "Text") {
            started = false;
        }
    });
    textHidden.addEventListener("input", drawTextTemp);
    textHidden.addEventListener("blur", drawTextPermenent);
    textHidden.addEventListener("keydown", function() {
        setTimeout(drawTextTemp, 10)});
} 

function drawTextTemp(e, isCaretFlash) {
        tempCtx.fillStyle = userPen.fillColour;
        tempCtx.font = "" + userPen.textSize + "px Arial";
        tempCtx.clearRect(0, 0, canvas.width, canvas.height);
        var textToShow = textHidden.value;
        var caret = " ";
        if(showCursor || !isCaretFlash)
        {
            var caret = "|";
        }
        var caretPos = textHidden.selectionStart;
        textToShow = textToShow.substr(0, caretPos) + caret + textToShow.substr(caretPos);
        fillTextMultiLine(tempCtx, textToShow, textPos.x, textPos.y);
        started = true;
}

function drawTextPermenent() {
    if(tool == "Text" && started) {
        started = false;
        tempCtx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = userPen.fillColour;
        ctx.font = "" + userPen.textSize + "px Arial";
        fillTextMultiLine(ctx, textHidden.value, textPos.x, textPos.y);
    }
}

function setUserFillColour(colour) {
    userPen.fillColour = colour;
}

function setUserPenColour(colour) {
    userPen.colour = colour;
}

function setUserPenThickness(thickness) {
    userPen.thickness = thickness;
}

function setUserTextSize() {
    size = parseInt(document.getElementById("textSize").value);
    if(size)
        userPen.textSize = size;

}

function drawCircle(ctx, centre, radius) {
    var circle = new Path2D();
    circle.arc(centre.x, centre.y, radius, 0, 2 * Math.PI)
    ctx.fill(circle);
}

function drawCircleOutline(ctx, centre, radius) {
    var circle = new Path2D();
    circle.arc(centre.x, centre.y, radius, 0, 2 * Math.PI)
    ctx.stroke(circle);
}

function fillTextMultiLine(ctx, text, x, y) {
    var lineHeight = ctx.measureText("M").width * 1.2;
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; ++i) {
        ctx.fillText(lines[i], x, y);
        y += lineHeight;
    }
}


function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function selectPen() {
    tool = "Pen";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="none";
}

function selectText() {
    tool = "Text";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="text";
}
