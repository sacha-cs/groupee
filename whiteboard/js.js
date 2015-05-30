var TOOL_INTERVAL = 1000;

//The canvases - the permenant and temporary
var canvas;
var ctx;
var tempCanvas;
var tempCtx;
var netCanvas;
var netCtx;
var canvasOffScreen = 1;

//The hidden text input that is used for text input.
var textHidden;

var started = false;
var mouseDown = false;
var userPen;
var tool;

var lastMousePos;
var clickPos;
var showCursor;

//Data for sending to server
var lastSentTime;
var sendInterval;
var toSend;
var lastUpdateNo;
var updatesToDraw = {};
var playingBack = false;
var playbackStartTime;
var playbackEndTime;
var writtenToNetworkTemp = false;
var tempToDraw = {};

function loaded() {
    startWhiteboard();
}

function startWhiteboard() {
    //Get the canvas and the context so we can draw stuff!
    canvas = document.getElementById("board");
    if(canvas.getContext) {
        ctx = canvas.getContext('2d');
    }
    tempCanvas = document.getElementById("tempBoard");
    if(tempCanvas.getContext)
        tempCtx = tempCanvas.getContext('2d');

    netCanvas = document.getElementById("networkTempBoard0");
    if(netCanvas.getContext)
        netCtx = netCanvas.getContext('2d');

    textHidden = document.getElementById("textHidden");

    userPen = {colour: "rgb(255, 0, 0)", 
               thickness:3, 
               fillColour: "rgb(0, 0, 0)",
               textSize: 20};
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    tempCtx.lineJoin = "round";
    tempCtx.lineCap = "round";
    netCtx.lineJoin = "round";
    netCtx.lineCap = "round";

    tool = "Pen";

    lastUpdateNo = 0;

    setInterval(drawUpdates, 33);
    updateWhiteboard(true);


    /* TODO: factor these out into their own function */
    tempCanvas.addEventListener('mousemove', function(evt) {
        mousePos = getMousePos(canvas, evt);
        if(tool == "Pen") {
            clearCtx(tempCtx);
            tempCtx.fillStyle = userPen.colour;
            tempCtx.strokeStyle = "black";
            tempCtx.lineWidth = 1;
            drawCircle(tempCtx, mousePos, userPen.thickness/2);
            drawCircleOutline(tempCtx, mousePos, userPen.thickness/2);
            if(mouseDown) {
                setUserPreferences(ctx);
                ctx.beginPath();
                ctx.moveTo(lastMousePos.x, lastMousePos.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.stroke();
                lastMousePos = mousePos;
                addDataToSend();
            }
        }
        if (tool == "Rectangle") {
            if(mouseDown) {
                clearCtx(tempCtx);
                setUserPreferences(tempCtx);
                var width = mousePos.x - clickPos.x;
                var height = mousePos.y - clickPos.y;
                tempCtx.beginPath();
                tempCtx.rect(clickPos.x, clickPos.y, width, height);
                tempCtx.fill();
                tempCtx.stroke();
                addDataToSend();
            }
        }
        if (tool == "Line") {
            if(mouseDown) {
                clearCtx(tempCtx);
                setUserPreferences(tempCtx);
                tempCtx.beginPath();
                tempCtx.moveTo(clickPos.x, clickPos.y);
                tempCtx.lineTo(mousePos.x, mousePos.y);
                tempCtx.stroke();
                addDataToSend();
            }
        }
        if (tool == "Circle") {
            if(mouseDown) {
                clearCtx(tempCtx);
                setUserPreferences(tempCtx);
                var centre = {};
                centre.x = (clickPos.x + mousePos.x) / 2;
                centre.y = (clickPos.y + mousePos.y) / 2;
                var xDiff = mousePos.x - clickPos.x;
                var yDiff = mousePos.y - clickPos.y;
                var radius = Math.sqrt(xDiff * xDiff + yDiff * yDiff) / 2;
                drawCircle(tempCtx, centre, radius);
                drawCircleOutline(tempCtx, centre, radius);
                addDataToSend();
            }
        }
    });

    tempCanvas.addEventListener("mousedown", function() {
        mouseDown = true;
        clickPos = mousePos;
        if(tool == "Text") {
            if(started)
                drawTextPermenent();
            setTimeout(function () { textHidden.focus() }, 100);
            textHidden.value = "";
        } else if(tool == "Pen") {
            started = true;
            lastMousePos = mousePos;
        } else if(tool == "Rectangle") {
            started = true;
        } else if(tool == "Line") {
            started = true;
        } else if(tool ==  "Circle") {
            started = true;
        }
        startedUsingTool();
        addDataToSend();

    });

    tempCanvas.addEventListener("mouseup", function(evt) {
        mouseDown = false;
        if(tool == "Rectangle") {
            setUserPreferences(ctx);
            clearCtx(tempCtx);
            var width = mousePos.x - clickPos.x;
            var height = mousePos.y - clickPos.y;
            ctx.beginPath();
            ctx.rect(clickPos.x, clickPos.y, width, height);
            ctx.fill();
            ctx.stroke();
        }
        if(tool == "Line") {
            clearCtx(tempCtx);
            setUserPreferences(ctx);
            ctx.beginPath();
            ctx.moveTo(clickPos.x, clickPos.y);
            ctx.lineTo(mousePos.x, mousePos.y);
            ctx.stroke();
            addDataToSend();
        }
        if(tool != "Text") {
            finishedUsingTool();
        }
        if(tool == "Circle") {
            clearCtx(tempCtx);
            setUserPreferences(ctx);
            var centre = {};
            centre.x = (clickPos.x + mousePos.x) / 2;
            centre.y = (clickPos.y + mousePos.y) / 2;
            var xDiff = mousePos.x - clickPos.x;
            var yDiff = mousePos.y - clickPos.y;
            var radius = Math.sqrt(xDiff * xDiff + yDiff * yDiff) / 2;
            drawCircle(ctx, centre, radius);
            drawCircleOutline(ctx, centre, radius);
            addDataToSend();
        }
    });
    textHidden.addEventListener("input", drawTextTemp);
    textHidden.addEventListener("blur", drawTextPermenent);
    textHidden.addEventListener("keydown", function() {
        setTimeout(drawTextTemp, 10)});

} 

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

/* Set drawing variables */
function setUserFillColour(colour) {
    userPen.fillColour = colour;
}

function setUserPenColour(colour) {
    userPen.colour = colour;
}

function setUserPenThickness(thickness) {
    userPen.thickness = thickness;
}

function setUserTextSize(size) {
    if(size)
        userPen.textSize = size;
}

function setPen(ctx, pen) {
    ctx.strokeStyle = pen.colour;
    ctx.lineWidth = pen.thickness;
    ctx.fillStyle = pen.fillColour;
    ctx.font = "" + pen.textSize + "px arial";
}

function setUserPreferences(ctx) {
    setPen(ctx, userPen);
}

function selectPen() {
    tool = "<img src='https://cdn4.iconfinder.com/data/icons/miu/22/editor_pencil_pen_edit_write_-32.png'>";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="none";
}

function selectText() {
    tool = "<img src='https://cdn4.iconfinder.com/data/icons/cc_mono_icon_set/blacks/32x32/text_letter_t.png'>";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="text";
}

function selectRectangle() {
    tool = "<img src='https://cdn3.iconfinder.com/data/icons/virtual-notebook/16/button_shape_rectangle-32.png'>";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="crosshair";
}

function selectLine() {
    tool = "<img src='https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/32/line.png'>";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="crosshair";
}

function selectCircle() {
    tool = "<img src='https://cdn3.iconfinder.com/data/icons/virtual-notebook/16/button_shape_oval-32.png'>";
    document.getElementById("currTool").innerHTML = tool;
    document.getElementById("wrapper").style.cursor="crosshair";
}

function drawTextTemp(e, isCaretFlash) {
    started = true;
    //Set the correct text style
    setUserPreferences(tempCtx);
    clearCtx(tempCtx);

    //Get the text with the caret in the right place
    var textToShow = textHidden.value;
    var caret = " ";
    if(showCursor || !isCaretFlash)
    {
        var caret = "|";
    }
    var caretPos = textHidden.selectionStart;
    textToShow = textToShow.substr(0, caretPos) + caret + textToShow.substr(caretPos);
    
    //Write the text
    fillTextMultiLine(tempCtx, textToShow, clickPos.x, clickPos.y);

    //Add data to send.
    if(textHidden.value)
        addDataToSend();
}

var cursorInterval = setInterval(function() { 
    showCursor = !showCursor;
    if(tool=="Text" && document.activeElement == textHidden)
        drawTextTemp(null, true);
     }, 500);

function drawTextPermenent() {
    if(tool == "Text" && started) {
        clearCtx(tempCtx);
        setUserPreferences(ctx);
        fillTextMultiLine(ctx, textHidden.value, clickPos.x, clickPos.y);
        if(textHidden.value)
            addDataToSend();
        finishedUsingTool();
    }
}

function fillTextMultiLine(ctx, text, x, y) {
    var lineHeight = ctx.measureText("M").width * 1.2;
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; ++i) {
        ctx.fillText(lines[i], x, y);
        y += lineHeight;
    }
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

function clearCtx(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function startedUsingTool() {
    toSend = {pen: userPen,
              tool:tool,
              data:[],
              justStarted:true,
              lastUpdate:false};
    lastSentTime = (new Date()).getTime();
    sendInterval = setInterval(sendToolUpdates, TOOL_INTERVAL);
}

function finishedUsingTool(ensureSent) {
    if(!started) return;
    started = false;
    
    if(ensureSent !== true)
        ensureSent = false;

    sendToolUpdates(true, ensureSent);    
    clearInterval(sendInterval);
}

function toolSendTime() {
    return (new Date()).getTime() - lastSentTime;
}

function addDataToSend() {
    var data = {};
    if(tool == "Pen") {
        data.x = mousePos.x
        data.y =  mousePos.y;
    } else if(tool == "Text") {
        data.x = clickPos.x;
        data.y = clickPos.y;
        data.text = encodeURIComponent(textHidden.value);
    } else if(tool == "Rectangle") {
        data.x = clickPos.x;
        data.y = clickPos.y;
        data.width = mousePos.x - clickPos.x;
        data.height = (mousePos.y - clickPos.y);
    } else if(tool == "Line") {
        data.x = clickPos.x;
        data.y = clickPos.y;
        data.mouseX = mousePos.x;
        data.mouseY = mousePos.y;
    } else if(tool == "Circle") {
        data.x = (clickPos.x + mousePos.x) / 2;
        data.y = (clickPos.y + mousePos.y) / 2;
        var xDiff = mousePos.x - clickPos.x;
        var yDiff = mousePos.y - clickPos.y;
        data.radius = Math.sqrt(xDiff * xDiff + yDiff * yDiff) / 2;
        console.log(data.radius);
    }
    data.time = toolSendTime();
    toSend.data.push(data);
}

function sendToolUpdates(lastUpdate, ensureSent) {
    if(ensureSent !== true)
        ensureSent = false;

    if(lastUpdate)
        toSend.lastUpdate = true;

    //Clear the data so we don't send twice, and the next update is definitely
    //not the first.

    var aClient = new HttpClient(ensureSent);
    aClient.post('update', JSON.stringify(toSend), function (response) { }, ensureSent);
    
    toSend.data = [];
    toSend.justStarted = false;

}

function updateWhiteboard(allUpdates) {
    var query = "last=" + lastUpdateNo;
    if(allUpdates)
        query+="&allUpdates=true";

    var client = new HttpClient();
    client.get('getUpdate?' + query, function(response) {
        response = JSON.parse(response);
        
        lastUpdateNo = response.lastUpdateNo;
        
        if(allUpdates) {
            playbackStartTime = (new Date()).getTime();
            playingBack = true;
            playbackEndTime = 0;
        }

        var responses = response.responses;
        for(var k = 0; k < responses.length; k++) {
            //The new update object.
            var update = responses[k];

            var appending;
            if(!updatesToDraw[update.id]) {
                appending = false;
                updatesToDraw[update.id] = update;
                update.start = playbackStartTime;
            } else {
                appending = true;
                var prev = updatesToDraw[update.id];
                if(update.lastUpdate == true) {
                    prev.lastUpdate = true;
                }
                prev.data = prev.data.concat(update.data);
                update = prev;
            }

            if (!appending && update.tool == "Pen") {
                update.last = update.data[0]
            }

            if(!appending) {
                update.start = (new Date()).getTime();
            }
            //If we're playing back/getting all updates
            if(playingBack) {
                update.start=playbackEndTime;
                if(update.lastUpdate == true) {
                    playbackEndTime+=parseInt(update.data[update.data.length-1].time);
                }
            }
        }
        updateWhiteboard();
    });
}

function drawUpdates() {
    var time = (new Date()).getTime();
    var length = 0;
    for (var i in updatesToDraw) {
        if (updatesToDraw.hasOwnProperty(i)) {
            length++;
            var timePassed;
            if(playingBack) {
                timePassed = (time - playbackStartTime) * 10 - updatesToDraw[i].start;
            } else {
                timePassed = time - updatesToDraw[i].start;
            }

            var data = updatesToDraw[i].data;
            setPen(ctx, updatesToDraw[i].pen);
            while(data.length > 0 && data[0].time < timePassed) {
                if(updatesToDraw[i].tool == "Pen") {
                    ctx.beginPath();
                    ctx.moveTo(updatesToDraw[i].last.x, updatesToDraw[i].last.y);
                    ctx.lineTo(data[0].x, data[0].y);
                    ctx.stroke();
                    updatesToDraw[i].last = data.shift();
                } else if(updatesToDraw[i].tool == "Text") {
                    tempToDraw[i] = {data: data.shift(),
                                     pen: updatesToDraw[i].pen,
                                     func: function(data, ctx) {
                        fillTextMultiLine(ctx, 
                                          decodeURIComponent(data.text), 
                                          data.x, data.y);
                    }};
                } else if(updatesToDraw[i].tool == "Rectangle") {
                    tempToDraw[i] = {data: data.shift(),
                                     pen: updatesToDraw[i].pen,
                                     func: function(data, ctx) {
                        ctx.beginPath();
                        ctx.rect(data.x, data.y, parseFloat(data.width), parseFloat(data.height));
                        ctx.fill();
                        ctx.stroke();
                    }};
                } else if(updatesToDraw[i].tool == "Line") {
                    tempToDraw[i] = {data: data.shift(),
                                     pen: updatesToDraw[i].pen,
                                     func: function(data, ctx) {
                        ctx.beginPath();
                        ctx.moveTo(data.x, data.y);
                        ctx.lineTo(data.mouseX, data.mouseY);
                        ctx.stroke();
                    }};
                } else if(updatesToDraw[i].tool == "Circle") {
                    tempToDraw[i] = {data: data.shift(),
                                     pen: updatesToDraw[i].pen,
                                     func: function(data, ctx) {
                        console.log(data);
                        drawCircle(ctx, data, data.radius);
                        drawCircleOutline(ctx, data, data.radius);
                    }};
                }
            }
            if(updatesToDraw[i].lastUpdate == true && data.length == 0) {
                delete updatesToDraw[i];
            }
            //If the we are done with all the data, remove it
        }
    }
    if(playingBack && length == 0)
        playingBack = false;
    clearCtx(netCtx);
    for (var i in tempToDraw) {
        if (tempToDraw.hasOwnProperty(i)) {
            var ctxToUse = netCtx;
            if(!updatesToDraw[i]) {
                ctxToUse = ctx;
            }
            setPen(ctxToUse, tempToDraw[i].pen);
            tempToDraw[i].func(tempToDraw[i].data, ctxToUse);
            if(!updatesToDraw[i]) {
                delete tempToDraw[i];
            }
        }
    }
}

window.onbeforeunload = function() {
    if(started) {
        addDataToSend();
        finishedUsingTool(true);
        var i = 0;
    }
}


