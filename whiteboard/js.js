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
var lastData;
var tempToDraw = {};


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


        if(tool != "Text") {
            finishedUsingTool();
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

function setUserPreferences(ctx) {
    ctx.strokeStyle = userPen.colour;
    ctx.lineWidth = userPen.thickness;
    ctx.fillStyle = userPen.fillColour;
    ctx.font = "" + userPen.textSize + "px Arial";
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

function selectRectangle() {
    tool = "Rectangle";
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
    toSend = {colour:userPen.colour,
              thickness:userPen.thickness,
              fillColour:userPen.fillColour,
              textSize:userPen.textSize,
              tool:tool,
              data:"",
              justStarted:true};
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
    var data = "";
    if(tool == "Pen")
        data = "x:" + mousePos.x + ";y:" + mousePos.y;
    else if(tool == "Text")
        data = "x:" + clickPos.x + ";y:" + clickPos.y + 
               ";text:" + encodeURIComponent(textHidden.value);
    else if(tool == "Rectangle")
        data = "x:" + clickPos.x + ";y:" + clickPos.y + 
               ";width:"+(mousePos.x - clickPos.x) +
               ";height:"+(mousePos.y - clickPos.y);
    lastData = data;
    toSend.data += data + ";time:"+toolSendTime() + "\n";
}

function sendToolUpdates(lastUpdate, ensureSent) {
    if(ensureSent !== true)
        ensureSent = false;

    var payload = "justStarted=" + toSend.justStarted +
                 "&data=colour+" + toSend.colour +
                 "@thickness+" + toSend.thickness +
                 "@fillColour+" + toSend.fillColour +
                 "@textSize+" + toSend.textSize +
                 "@tool+" + tool +
                 "@data+" + toSend.data;

    if(lastUpdate)
        payload += "&lastUpdate=true";
    encodeURIComponent(payload);

    //Clear the data so we don't send twice, and the next update is definitely
    //not the first.
    toSend.data = "";
    toSend.justStarted = false;


    var aClient = new HttpClient(ensureSent);
    aClient.post('update', payload, function (response) { }, ensureSent);
}

function updateWhiteboard(allUpdates) {
    var query = "last=" + lastUpdateNo;
    if(allUpdates)
        query+="&allUpdates=true";

    var client = new HttpClient();
    client.get('getUpdate?' + query, function(response) {
        /*The response is the form:
          lastUpdate<>response1\response2\...\responseN(<>allUpdates)
          where a response is of the form:
          key+value@key+value@...@data+updateData
          where updateData has a form dependent on the tool, but usually
          key:value;key:value;...;key:value\n */
        var res = response.split("<>");
        
        lastUpdateNo = parseInt(res[0]);
        
        var allUpdates = false;
        playbackStartTime = (new Date()).getTime();
        if(res[2]) {
            allUpdates = true;
            playingBack = true;
            playbackEndTime = 0;
        }

        var responses = res[1].split("\\");
        for(var k = 0; k < responses.length; k++) {
            console.log(responses[k]);
            //The new update object.
            var update = {};

            //Split up the update information.
            res = responses[k].split("@");
            for(var i = 0; i < res.length; i++) {
                var keyAndValue = res[i].split("+");
                update[keyAndValue[0]] = keyAndValue[1];
                console.log(keyAndValue[0] + "=" + keyAndValue[1]);
            }

            //Correct some strings
            if(update.lastUpdate == "true") update.lastUpdate = true;
            else update.lastUpdate = false;

            console.log("Last update? " + update.lastUpdate);

            //If we have data
            if(update.data) {
                //Split the points
                var points = update.data.split('\n');
                
                //Check if it's a new set of points or just a continuation.
                var appending;
                if(!updatesToDraw[update.id]) {
                    appending = false;
                    updatesToDraw[update.id] = update;
                    update.data = [];
                } else {
                    appending = true;
                    if(update.lastUpdate == true) {
                        updatesToDraw[update.id].lastUpdate = true;
                    }
                    update = updatesToDraw[update.id];
                }
                
                //Loop through each of the points
                for(var j = 0; j < points.length; j++) {
                    var info = points[j].split(";");
                    var infoObject = {};
                    
                    if(!info)
                        continue;

                    for(var i = 0; i < info.length; i++) {
                        var keyAndValue = info[i].split(":");
                        infoObject[keyAndValue[0]] = keyAndValue[1];
                    }
                    update.data.push(infoObject);
                    //Speed up text typing in playback mode.
                    if(playingBack && update.tool == "Text") {
                        update.data[update.data.length -1].time = (update.data.length - 1) * 50;
                    }
                }
                if(!appending)
                    update.start = playbackStartTime;

                if (!appending && update.tool == "Pen") {
                    console.log("Setting last...");
                    update.last = update.data[0]
                    console.log(update.last);
                }
                //If we're playing back/getting all updates
                if(playingBack) {
                    update.start=playbackEndTime;
                    if(update.lastUpdate == true) {
                        playbackEndTime+=parseInt(update.data[update.data.length-1].time);
                    }
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
                timePassed = (time - playbackStartTime) * 5 - updatesToDraw[i].start;
            } else {
                timePassed = time - updatesToDraw[i].start;
            }

            var data = updatesToDraw[i].data;
            ctx.strokeStyle = updatesToDraw[i].colour;
            ctx.lineWidth = updatesToDraw[i].thickness;
            ctx.fillStyle = updatesToDraw[i].fillColour;
            ctx.font = "" + updatesToDraw[i].textSize + "px Arial";
            while(data.length > 0 && data[0].time < timePassed) {
                if(updatesToDraw[i].tool == "Pen") {
                    ctx.beginPath();
                    ctx.moveTo(updatesToDraw[i].last.x, updatesToDraw[i].last.y);
                    ctx.lineTo(data[0].x, data[0].y);
                    ctx.stroke();
                    updatesToDraw[i].last = data.shift();
                } else if(updatesToDraw[i].tool == "Text") {
                    
                    if(updatesToDraw[i].lastUpdate && !data[1]) {
                        fillTextMultiLine(ctx, decodeURIComponent(data[0].text), data[0].x, data[0].y);
                        delete tempToDraw[i];
                    } else {
                        tempToDraw[i] = function(data, ctx) {
                            fillTextMultiLine(ctx, decodeURIComponent(data.text), data.x, data.y);
                        }
                    }
                    
                    data.shift();
                } else if(updatesToDraw[i].tool == "Rectangle") {
                    if(data[1] && data[1].time < timePassed) {
                        data.shift();
                        continue;
                    }
                    tempToDraw[i] = function(data, ctx) {
                        ctx.beginPath();
                        console.log(data);
                        console.log(data.width);
                        console.log(parseFloat(data.width));
                        ctx.rect(data.x, data.y, parseFloat(data.width), parseFloat(data.height));
                        ctx.fill();
                        ctx.stroke();
                    }
                    var last = data.shift();
                    if(updatesToDraw[i].lastUpdate && !data[0]) {
                        ctx.beginPath();
                        ctx.rect(last.x, last.y, parseFloat(last.width), parseFloat(last.height));
                        ctx.fill();
                        ctx.stroke();
                        delete tempToDraw[i];
                    }
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
            netCtx.strokeStyle = updatesToDraw[i].colour;
            netCtx.lineWidth = updatesToDraw[i].thickness;
            netCtx.fillStyle = updatesToDraw[i].fillColour;
            netCtx.font = "" + updatesToDraw[i].textSize + "px Arial";
            tempToDraw[i](updatesToDraw[i].data[0], netCtx);
        }
    }
    console.log(playingBack);
}

window.onbeforeunload = function() {
    if(started) {
        addDataToSend();
        finishedUsingTool(true);
        var i = 0;
    }
}


