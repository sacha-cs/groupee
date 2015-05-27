var TOOL_INTERVAL = 1000;

//The canvases - the permenant and temporary
var canvas;
var ctx;
var tempCanvas;
var tempCtx;
var networkTempCanvas;
var networkTempCtx;

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
var lastUpdateNo;
var updatesToDraw = {};
var playingBack = false;
var playbackStartTime;
var playbackEndTime;
var writtenToNetworkTemp = false;
var lastData;


function startWhiteboard() {
    //Get the canvas and the context so we can draw stuff!
    canvas = document.getElementById("board");
    if(canvas.getContext) {
        ctx = canvas.getContext('2d');
    }
    tempCanvas = document.getElementById("tempBoard");
    if(tempCanvas.getContext)
        tempCtx = tempCanvas.getContext('2d');
    networkTempCanvas = document.getElementById("tempBoard");
    if(networkTempCanvas.getContext)
        networkTempCtx = networkTempCanvas.getContext('2d');
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
                addDataToSend("x:"+mousePos.x+";y:"+mousePos.y);
            }
        }
    });

    tempCanvas.addEventListener("mousedown", function() {
        mouseDown = true;
        if(tool == "Text") {
            if(started)
                drawTextPermenent();
            textPos = mousePos;
            startedUsingTool();
            setTimeout(function () { textHidden.focus() }, 100);
            textHidden.value = "";
        } else if(tool == "Pen") {
            started = true;
            startedUsingTool();
            lastMousePos = mousePos;
            addDataToSend("x:"+mousePos.x+";y:"+mousePos.y);
        }

    });

    tempCanvas.addEventListener("mouseup", function(evt) {
        mouseDown = false;
        if(tool != "Text") {
            finishedUsingTool();
        }
    });
    textHidden.addEventListener("input", drawTextTemp);
    textHidden.addEventListener("blur", drawTextPermenent);
    textHidden.addEventListener("keydown", function() {
        setTimeout(drawTextTemp, 10)});

} 

function drawTextTemp(e, isCaretFlash) {
    started = true;
    //Set the correct text style
    tempCtx.fillStyle = userPen.fillColour;
    tempCtx.font = "" + userPen.textSize + "px Arial";
    tempCtx.clearRect(0, 0, canvas.width, canvas.height);

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
    fillTextMultiLine(tempCtx, textToShow, textPos.x, textPos.y);

    //Add data to send.
    if(textHidden.value)
        addDataToSend("x:" +textPos.x + ";y:" + textPos.y + ";text:" + encodeURIComponent(textHidden.value));
}

function drawTextPermenent() {
    if(tool == "Text" && started) {
        tempCtx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = userPen.fillColour;
        ctx.font = "" + userPen.textSize + "px Arial";
        fillTextMultiLine(ctx, textHidden.value, textPos.x, textPos.y);
        if(textHidden.value)
            addDataToSend("x:" +textPos.x + ";y:" + textPos.y + ";text:"  );
        console.log("Finished drawing text.");
        finishedUsingTool();
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

function setUserTextSize(size) {
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

    console.log("Finished and ensure?: " + ensureSent);

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
        data = "x:" + textPos.x + ";y:" + textPos.y + ";text:" + encodeURIComponent(textHidden.value);
    lastData = data;
    toSend.data += data + ";time:"+toolSendTime() + "\n";
}

function sendToolUpdates(lastUpdate, ensureSent) {
    var payload = "justStarted=" + toSend.justStarted +
                 "&data=colour-" + toSend.colour +
                 "@thickness-" + toSend.thickness +
                 "@fillColour-" + toSend.fillColour +
                 "@textSize-" + toSend.textSize +
                 "@tool-" + tool +
                 "@data-" + toSend.data;

    if(lastUpdate)
        payload += "&lastUpdate=true";

    toSend.data = "";
    toSend.justStarted = false;
    if(ensureSent !== true)
        ensureSent = false;
    var aClient = new HttpClient(ensureSent);
    encodeURIComponent(payload);
    aClient.post('update', payload, function (repsonse) { console.log("Got update"); }, ensureSent);
}

function updateWhiteboard(allUpdates) {
    var client = new HttpClient();
    var query = "last=" + lastUpdateNo;
    if(allUpdates)
        query+="&allUpdates=true";
    client.get('getUpdate?' + query, function(response) {
        /*The response is the form:
          lastUpdate<>response1\response2\...\responseN(<>allUpdates)
          where a response is of the form:
          key-value@key-value@...@data-updateData
          where updateData has a form dependent on the tool, but usually
          key:value;key:value;...;key:value\n */
        var res = response.split("<>");
        lastUpdateNo = parseInt(res[0]);
        var allUpdates = false;
        if(res[2]) {
            allUpdates = true;
            playbackEndTime = 0;
        }
        var responses = res[1].split("\\");
        if(allUpdates) {
            playbackStartTime = (new Date()).getTime();
            console.log(response);
        }
        var totalToolUseTime = 0;
        for(var k = 0; k < responses.length; k++) {
            //The new update object.
            var update = {};

            //Split up the update information.
            res = responses[k].split("@");
            for(var i = 0; i < res.length; i++) {
                var keyAndValue = res[i].split("-");
                update[keyAndValue[0]] = keyAndValue[1];
            }

            //Correct some strings
            if(update.lastUpdate == "true") update.lastUpdate = true;
            else update.lastUpdate = false;


            //If we have data
            if(update.data) {
                //Split the points
                var points = update.data.split('\n');
                
                //Check if it's a new set of points or just a continuation.
                console.log("Last update?" + update.lastUpdate);
                var appending = true;
                if(!updatesToDraw[update.id]) {
                    appending = false;
                    updatesToDraw[update.id] = update;
                    update.data = [];
                    console.log("new update!");
                } else {
                    if(update.lastUpdate == true) {
                        console.log("Is last update of " + update.id);
                        updatesToDraw[update.id].lastUpdate = true;
                    }
                    update = updatesToDraw[update.id];
                }
                
                //Loop through each of the points
                for(var j = 0; j < points.length; j++) {
                    var info = points[j].split(";");
                    
                    if(!info)
                        continue;

                    //TODO: get keys and values automatically
                    if(update.tool == "Pen") {
                        update.data.push({x:info[0].split(":")[1],
                                          y:info[1].split(":")[1],
                                          time:info[2].split(":")[1]} );
                        update.last = update.data[0];
                    } else if(update.tool == "Text") {
                        if(update.data.length==0) {
                            console.log("Start time: " + info[3].split(":")[1]);
                            console.log("data: " + info[2]);
                        }
                        update.data.push({x:info[0].split(":")[1],
                                          y:info[1].split(":")[1],
                                          text:info[2].split(":")[1],
                                          time:info[3].split(":")[1]});
                        if(allUpdates) {
                            update.data[update.data.length -1].time = (update.data.length - 1) * 50;
                        }
                    }
                }

                //If we're playing back/getting all updates
                if(allUpdates) {
                    playingBack = true;
                    update.playback = true;
                    update.start=playbackEndTime;
                    if(update.lastUpdate == true) {
                        playbackEndTime+=parseInt(update.data[update.data.length-1].time);
                    }
                } else {
                    if(!appending) {
                        console.log("Set start time!");
                        update.start = (new Date()).getTime();
                    }
                }
            } else {
                console.log("no data but " + update.id);
            }
        }
        updateWhiteboard();
    });
}

function drawUpdates() {
    if(writtenToNetworkTemp) {
        writtenToNetworkTemp = false;
    }
    var time = (new Date()).getTime();
    var length = 0;
    for (var i in updatesToDraw) {
        if (updatesToDraw.hasOwnProperty(i)) {
            length++;
            var timePassed;
            if(playingBack) {
                timePassed = (time - playbackStartTime) * 1 - updatesToDraw[i].start;
            } else {
                timePassed = time - updatesToDraw[i].start;
            }

            var data = updatesToDraw[i].data;
            while(data.length > 0 && data[0].time < timePassed) {
                if(updatesToDraw[i].tool == "Pen") {
                    ctx.strokeStyle = updatesToDraw[i].colour;
                    ctx.lineWidth = updatesToDraw[i].thickness;
                    ctx.beginPath();
                    ctx.moveTo(updatesToDraw[i].last.x, updatesToDraw[i].last.y);
                    ctx.lineTo(data[0].x, data[0].y);
                    ctx.stroke();
                    updatesToDraw[i].last = data.shift();
                } else if(updatesToDraw[i].tool == "Text") {
                    if(data[1] && timePassed > data[1].time) {
                        data.shift();
                        continue;
                    }
                    if(!writtenToNetworkTemp)
                        networkTempCtx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    writtenToNetworkTemp = true;
                    var textCtx = networkTempCtx;
                    if(updatesToDraw[i].lastUpdate && !data[1]) {
                         textCtx = ctx;
                    }
                    textCtx.fillStyle = updatesToDraw[i].fillColour;
                    textCtx.font = "" + updatesToDraw[i].textSize + "px Arial";
                    fillTextMultiLine(textCtx, decodeURIComponent(data[0].text), data[0].x, data[0].y);

                    if(data[1]) {
                        data[0].time = data[1].time;
                    } else if (updatesToDraw[i].lastUpdate) {
                        console.log("done");
                        data.shift();
                    } else {
                        data[0].time = parseInt(data[0].time) + 33;
                    }

                }
            }
            if(updatesToDraw[i].lastUpdate == true && data.length == 0) {
                console.log("deleting...");
                delete updatesToDraw[i];
            }
            //If the we are done with all the data, remove it
        }
    }
    if(playingBack && length == 0)
        playingBack = false;
}

window.onbeforeunload = function() {
    if(started) {
        addDataToSend();
        finishedUsingTool(true);
        console.log("Finsihed...");
        var i = 0;
    }
}


