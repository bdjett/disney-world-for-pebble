var maxAppMessageBuffer = 100;
var maxAppMessageTries = 3;
var appMessageRetryTimeout = 3000;
var appMessageTimeout = 100;
var httpTimeout = 12000;
var appMessageQueue = [];

// sendAppMessage
// --------------
// sends app message queue to pebble
var sendAppMessage = function() {
    if (appMessageQueue.length > 0) {
        var currentAppMessage = appMessageQueue[0];
        currentAppMessage.numTries = currentAppMessage.numTries || 0;
        currentAppMessage.transactionId = currentAppMessage.transactionId || -1;

        if (currentAppMessage.numTries < maxAppMessageTries) {
            Pebble.sendAppMessage(
                currentAppMessage.message,
                function(e) {
                    appMessageQueue.shift();
                    setTimeout(function() {
                        sendAppMessage();
                    }, appMessageTimeout);
                }, function(e) {
                    console.log("Faled sending AppMessage for transactionId: " + e.data.transactionId + ". Error: " + e.data.error.message);
                    appMessageQueue[0].transactionId = e.data.transactionId;
                    appMessageQueue[0].numTries++;
                    setTimeout(function() {
                        sendAppMessage();
                    }, appMessageRetryTimeout);
                }
            );
        } else {
            console.log("Faled sending AppMessage after multiple attemps for transactionId: " + currentAppMessage.transactionId + ". Error: None. Here's the message: " + JSON.stringify(currentAppMessage.message));
        }
    }
};

// sendError
// ---------
// displays error message on Pebble
var sendError = function(error) {
    appMessageQueue.push({'message': {
                            'error': error.toString(),
    }});
    sendAppMessage();
};

// PEBBLE APP READY
Pebble.addEventListener("ready", function(e) {
  // JS app ready
});

// RECEIVED APP MESSAGE
Pebble.addEventListener("appmessage", function(e) {
  console.log("Got app message");
  if (e.payload.getWaitTimes) {
    // GET WAIT TIMES
    if (e.payload.getWaitTimes == "Magic Kingdom") {
      getWaitTimes(80007944);
    } else if (e.payload.getWaitTimes == "Epcot") {
      getWaitTimes(80007838);
    } else if (e.payload.getWaitTimes == "Hollywood Studios") {
      getWaitTimes(80007998);
    } else if (e.payload.getWaitTimes == "Animal Kingdom") {
      getWaitTimes(80007823);
    }
  } else if (e.payload.cancelMessages) {
    // RESET APP MESSAGE QUEUE
    appMessageQueue = [];
  } else if (e.payload.getAttractionInfo) {
    // GET ATTRACTION INFO
    getAttractionInfo(e.payload.getAttractionInfo);
  } else if (e.payload.getEntertainment) {
    // GET ENTERTAINMENT
    if (e.payload.getEntertainment == "Magic Kingdom") {
      getEntertainment(80007944);
    } else if (e.payload.getEntertainment == "Epcot") {
      getEntertainment(80007838);
    } else if (e.payload.getEntertainment == "Hollywood Studios") {
      getEntertainment(80007998);
    } else if (e.payload.getEntertainment == "Animal Kingdom") {
      getEntertainment(80007823);
    }
  } else if (e.payload.getSchedule) {
    // GET ENTERTAINMENT SCHEDULE
    getSchedule(e.payload.getSchedule);
  } else if (e.payload.getItinerary) {
    // GET ITINERARY
    // Require user to be logged in
    if (localStorage.username && localStorage.password) {
      // User is logged in
      getItinerary();
    } else {
      // User is not logged in
      sendError("Please login on the Pebble app");
    }
  }
});

// SHOW CONFIG WINDOW
Pebble.addEventListener("showConfiguration", function(e) {
    Pebble.openURL("http://logicalpixels.com/mde/settings.html");
});

// CLOSED CONFIG WINDOW
Pebble.addEventListener("webviewclosed", function(e) {
    var configuration = JSON.parse(decodeURIComponent(e.response));
    localStorage.username = configuration.username.toString();
    localStorage.password = configuration.password.toString();
    if (localStorage.username && localStorage.password) {
      // Got a new username and password, clear out xid, swid, and privateToken,
      // forcing new ones to be downloaded
      localStorage.xid = "";
      localStorage.swid = "";
      localStorage.privateToken = "";
    } else {
      // No login info
    }
});