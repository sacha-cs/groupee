var TOOL_INTERVAL = 1000;

//The canvases - the permenant and temporary
var canvas;
var ctx;
var tempCanvas;
var tempCtx;

//The hidden text input that is used for text input.
var textHidden;

var started = false;
var mouseDown = false;
var userPen;
var tool;

var lastMousePos;
var textPos;
var showCursor;

//Data for sending to server
var lastSentTime;
var sendInterval;
var toSend;
var lastUpdate;
var updatesToDraw = [];

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

    tool = "Pen";

    lastUpdate = 0;

    setInterval(drawUpdates, 33);

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
                ctx.strokeStyle = userPen.colour;
                ctx.lineWidth = userPen.thickness;
                ctx.beginPath();
                ctx.moveTo(lastMousePos.x, lastMousePos.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.stroke();
                lastMousePos = mousePos;
                toSend.data += ("x:"+mousePos.x+";y:"+mousePos.y+";time:"+toolSendTime() + "\n");
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
        } else if(tool == "Pen") {
            started = true;
            startedUsingTool();
            lastMousePos = mousePos;
            toSend.data += ("x:"+mousePos.x+";y:"+mousePos.y+";time:"+toolSendTime()+"\n");
        }

    });

    tempCanvas.addEventListener("mouseup", function(evt) {
        mouseDown = false;
        if(tool != "Text") {
            started = false;
            finishedUsingTool();
        }
    });
    textHidden.addEventListener("input", drawTextTemp);
    textHidden.addEventListener("blur", drawTextPermenent);
    textHidden.addEventListener("keydown", function() {
        setTimeout(drawTextTemp, 10)});

    updateWhiteboard();
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

var cursorInterval = setInterval(function() { 
    showCursor = !showCursor;
    if(tool=="Text" && document.activeElement == textHidden)
        drawTextTemp(null, true);
     }, 500);

function startedUsingTool() {
    toSend = {colour:userPen.colour,
              thickness:userPen.thickness,
              fillColour:userPen.fillColour,
              textSize:userPen.textSize,
              tool:tool,
              data:""};
    lastSentTime = (new Date()).getTime();
    sendInterval = setInterval(sendToolUpdates, TOOL_INTERVAL);
}

function finishedUsingTool() {
    clearInterval(sendInterval);
    sendToolUpdates();    
}

function toolSendTime() {
    return (new Date()).getTime() - lastSentTime;
}

function sendToolUpdates() {
    var payload = "data=colour-" + toSend.colour +
                 "@thickness-" + toSend.thickness +
                 "@fillColour-" + toSend.fillColour +
                 "@textSize-" + toSend.textSize +
                 "@tool-" + tool +
                 "@data-" + toSend.data;
    toSend.data = "";
    lastSentTime = (new Date()).getTime();
    var aClient = new HttpClient();
    aClient.post('update', payload, function (repsonse) {});
}

function updateWhiteboard() {
    var client = new HttpClient();
    client.get('getUpdate?last=' + lastUpdate, function(response) {
        var res = response.split("<>");
        lastUpdate = parseInt(res[0]);
        var responses = res[1].split("\\");
        for(var k = 0; k < responses.length; k++) {
            var update = {};
            res = responses[k].split("@");
            for(var i = 0; i < res.length; i++) {
                var keyAndValue = res[i].split("-");
                console.log("Key and Value: " + keyAndValue);
                update[keyAndValue[0]] = keyAndValue[1];
            }
            if(update.data) {
                var points = update.data.split('\n');
                update.data = [];
                for(var j = 0; j < points.length; j++) {
                    var info = points[j].split(";");
                    if(!info || info == "")
                        continue;
                    update.data.push({x:info[0].split(":")[1],
                                      y:info[1].split(":")[1],
                                      time:info[2].split(":")[1]} );
                }
                update.last = update.data[0];
                update.start = (new Date()).getTime();
                updatesToDraw.push(update);
            }
        }
        updateWhiteboard();
    });
}

function drawUpdates() {
    var time = (new Date()).getTime();
    for(var i = 0; i < updatesToDraw.length; i++) {
        var timePassed = time - updatesToDraw[i].start;
        var data = updatesToDraw[i].data;
        while(data.length > 0 && data[0].time < timePassed) {
           if(updatesToDraw[i].tool == "Pen") {
                ctx.strokeStyle = updatesToDraw[i].colour;
                ctx.lineWidth = updatesToDraw[i].thickness;
                console.log(updatesToDraw[i].thickness);
                ctx.beginPath();
                ctx.moveTo(updatesToDraw[i].last.x, updatesToDraw[i].last.y);
                ctx.lineTo(data[0].x, data[0].y);
                ctx.stroke();
                updatesToDraw[i].last = data.shift();
           }
        }
    }
}
