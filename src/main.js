var maxAppMessageTries = 3;
var appMessageRetryTimeout = 3000;
var appMessageTimeout = 0;
var httpTimeout = 10000;
var appMessageQueue = [];
var requesting;

var log = {
  debug: function(message) {
    var logArray = JSON.parse(localStorage.getItem("wdw-log"));
    if (!logArray) {
      logArray = [];
    }
    logArray.push(message);
    localStorage.setItem("wdw-log", JSON.stringify(logArray));
  },

  getJSONLog: function() {
    return localStorage.getItem("wdw-log");
  },

  getLog: function() {
    return JSON.parse(localStorage.getItem("wdw-log"));
  },
}

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
                    console.log("Failed sending AppMessage for transactionId: " + e.data.transactionId + ". Error: " + e.data.error.message);
                    appMessageQueue[0].transactionId = e.data.transactionId;
                    appMessageQueue[0].numTries++;
                    setTimeout(function() {
                        sendAppMessage();
                    }, appMessageRetryTimeout);
                }
            );
        } else {
            console.log("Failed sending AppMessage after multiple attemps for transactionId: " + currentAppMessage.transactionId + ". Error: None. Here's the message: " + JSON.stringify(currentAppMessage.message));
        }
    }
};

// sendError
// ---------
// displays error message on Pebble
var sendError = function(errorTitle, errorDesc) {
    appMessageQueue.push({'message': {
                            'errorTitle': errorTitle.toString(),
                            'errorDesc': errorDesc.toString()
    }});
    sendAppMessage();
};

// getPublicToken
// --------------
// Get a public token for use in wait times
var getPublicToken = function() {
  console.log("Getting public token");
  log.debug('Getting public token');
  var req = new XMLHttpRequest();
  var requestUrl = "https://authorization.go.com/token?assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.IOS-PROD&client_secret=&grant_type=assertion";
  req.open('POST', requestUrl, false);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status + ', Headers: ' + JSON.stringify(req.headers));
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          localStorage.publicToken = response.access_token;
        }
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    getPublicToken();
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
  };
  req.send(null);
};

// getWaitTimes
// ------------
// Get wait times for given park id
var getWaitTimes = function(park) {
  console.log("Getting wait times");
  log.debug('Getting wait times');
  if (requesting) {
    return;
  }
  requesting = true;
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/facility-service/theme-parks/" + park + "/wait-times?fields=entries(.(id,name,type,waitTime(postedWaitMinutes,rollUpWaitTimeMessage,status,fastPass(available,startTime))))";
  req.open('GET', requestUrl, true);
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    console.log("Ready state: " + req.readyState + " Status: " + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var entries = response.entries;
          entries.sort(function(a, b) {
            return (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
          });
          var i = 0;
          entries.forEach(function(element, index, array) {
            if (element.type == "Attraction") {
              var name = element.name.substring(0,20);
              var id = element.id;
              var waitTime;
              if (element.waitTime.postedWaitMinutes !== undefined) {
                waitTime = element.waitTime.postedWaitMinutes + " minutes";
              } else if (element.waitTime.rollUpWaitTimeMessage !== undefined){
                waitTime = element.waitTime.rollUpWaitTimeMessage.substring(0,30);
              } else if (element.waitTime.status == "Extra Magic Hours"){
                waitTime = element.waitTime.status.substring(0,30);
              }
              appMessageQueue.push({'message': {
                'index': i,
                'id': id,
                'name': name,
                'waitTime': waitTime
              }});
              i++;
            }
          });
          appMessageQueue.push({'message': {
            'name': "",
            'waitTime': ""
          }});
          requesting = false;
          sendAppMessage();
        }
      } else {
        // Unauthorized, publicToken must be expired, request a new one and try again
        requesting = false;
        getPublicToken();
        getWaitTimes(park);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    sendError("Oops!", "There was an error getting current wait times.");
    requesting = false;
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    sendError("Oops!", "There was an error getting current wait times.");
    requesting = false;
  };
  req.send(null);
};

// getAttractionInfo
// -----------------
// Given an attraction ID, returns information about it
var getAttractionInfo = function(attractionId) {
  console.log("Getting attraction info");
  log.debug('Getting attraction info');
  if (requesting) {
    return;
  }
  requesting = true;
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/attractions/" + attractionId;
  req.open('GET', requestUrl, true);
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var desc = "";
          var land = "";
          if (response.descriptions && response.descriptions.shortDescriptionMobile && response.descriptions.shortDescriptionMobile.text) {
            desc = response.descriptions.shortDescriptionMobile.text;
          }
          if (response.links && response.links.ancestorLand && response.links.ancestorLand.title) {
            land = response.links.ancestorLand.title;
          }
          appMessageQueue.push({'message': {
            'name': response.name.substring(0,75),
            'location': land.substring(0,75),
            'description': desc.substring(0,150)
          }});
          requesting = false;
          sendAppMessage();
        }
      } else {
        // Unauhtorized, public token must be expired, request new one and try again
        requesting = false;
        getPublicToken();
        getAttractionInfo(attractionId);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    sendError("Oops!", "There was an error getting the attraction info.");
    requesting = false;
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    sendError("Oops!", "There was an error getting the attraction info.");
    requesting = false;
  };
  req.send(null);
};

// getEntertainment
// ------------
// Get entertainment for park id
var getEntertainment = function(park) {
  console.log("Getting entertainment");
  log.debug('Getting entertainment');
  if (requesting) {
    return;
  }
  requesting = true;
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/facility-service/theme-parks/" + park + "/wait-times?fields=entries(.(id,name,type,waitTime(postedWaitMinutes,rollUpWaitTimeMessage,status,fastPass(available,startTime))))";
  req.open('GET', requestUrl, true);
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var entries = response.entries;
          entries.sort(function(a, b) {
            return (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
          });
          var i = 0;
          entries.forEach(function(element, index, array) {
            if (element.type == "Entertainment") {
              var name = element.name.substring(0,20);
              var id = element.id;
              var waitTime;
              if (element.waitTime.postedWaitMinutes !== undefined) {
                waitTime = element.waitTime.postedWaitMinutes + " minutes";
              } else if (element.waitTime.rollUpWaitTimeMessage !== undefined){
                waitTime = element.waitTime.rollUpWaitTimeMessage.substring(0,30);
              } else if (element.waitTime.status == "Extra Magic Hours"){
                waitTime = element.waitTime.status.substring(0,30);
              }
              appMessageQueue.push({'message': {
                'index': i,
                'id': id,
                'name': name,
                'entertainmentStatus': waitTime
              }});
              i++;
            }
          });
          appMessageQueue.push({'message': {
            'name': "",
            'entertainmentStatus': ""
          }});
          requesting = false;
          sendAppMessage();
        }
      } else {
        // Unauthorized, get new public token
        requesting = false;
        getPublicToken();
        getEntertainment(park);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    sendError("Oops!", "There was an error getting entertainment.");
    requesting = false;
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    sendError("Oops!", "There was an error getting entertainment.");
    requesting = false;
  };
  req.send(null);
};

// tConvert
// --------
// Convert a 24-hour timestamp to 12 hour with am/pm
function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
    time[3] = " ";
  }
  return time.join (''); // return adjusted time or original string
}

// getSchedule
// -----------------
// Get the schedule for a given attraction ID
var getSchedule = function(attractionId) {
  console.log("Getting schedule");
  log.debug('Getting schedule');
  if (requesting) {
    return;
  }
  requesting = true;
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10) {
    dd='0'+dd;
  }
  if(mm<10) {
    mm='0'+mm;
  }
  var requestUrl = "https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/schedules/" + attractionId + "?date=" + yyyy + "-" + mm + "-" + dd;
  req.open('GET', requestUrl, true);
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var name = response.name;
          var times = [];
          for (var i = 0; i < response.schedules.length; i++) {
            var time = response.schedules[i];
            var start = tConvert(time.startTime);
            var end = tConvert(time.endTime);
            if (start == end) {
              times.push(start);
            } else {
              times.push(start + " - " + end);
            }
          }
          times.forEach(function(element, index, array) {
            appMessageQueue.push({'message': {
              'index': index,
              'name': name,
              'scheduleTime': element
            }});
          });
          appMessageQueue.push({'message': {
            'scheduleTime': ""
          }});
          requesting = false;
          sendAppMessage();
        }
      } else {
        // Unauthorized, get new public token
        requesting = false;
        getPublicToken();
        getSchedule(attractionId);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    sendError("Oops!", "There was an error getting the entertainment schedule.");
    requesting = false;
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    sendError("Oops!", "There was an error getting the entertainment schedule.");
    requesting = false;
  };
  req.send(null);
};

// getPrivateToken
// --------------
// Get a private token for itinerary access
var getPrivateToken = function() {
  log.debug('Getting private token');
  var req = new XMLHttpRequest();
  var requestUrl = "https://authorization.go.com/token?client_id=WDPRO-MOBILE.MDX.WDW.IOS-PROD&client_secret=&grant_type=password&password=" + encodeURIComponent(localStorage.password) + "&scope=RETURN_ALL_CLIENT_SCOPES&username=" + encodeURIComponent(localStorage.username);
  req.open('POST', requestUrl, false);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          localStorage.privateToken = response.access_token;
          localStorage.swid = response.swid;
        }
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    getPrivateToken();
  };
  req.onerror = function() {
    log.debug('Error');
    console.log("Connection failed");
  };
  req.send(null);
};

// getXID
// ------
// Get a user's xid from their swid
var getXID = function() {
  log.debug('Getting XID');
  getPrivateToken();
  var req = new XMLHttpRequest();
  var requestUrl = "https://disneyparks.api.go.com/assembly/guest/id;swid=" + encodeURIComponent(localStorage.swid) + "/profile";
  req.setRequestHeader("Authorization", "BEARER " + localStorage.privateToken);
  req.open('GET', requestUrl, false);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var guestIds = response.guestIdentifiers;
          for (var i = 0; i < guestIds.length; i++) {
            if (guestIds[i].type == "xid") {
              localStorage.xid = guestIds[i].value;
            }
          }
        }
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    getXID();
  };
  req.send(null);
};

// getItinerary
// ------------
// Get guests itinerary
var getItinerary = function() {
  log.debug('Getting itinerary');
  if (requesting) {
    return;
  }
  requesting = true;
  if (!localStorage.xid) {
    getXID();
  } else {
    getPrivateToken();
  }
  var req = new XMLHttpRequest();
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10) {
    dd='0'+dd;
  }
  if(mm<10) {
    mm='0'+mm;
  }
  var requestUrl = "https://disneyparks.api.go.com/expand-service/expand?url=https%3A%2F%2Fdisneyparks%2Eapi%2Ego%2Ecom%2Fassembly%2Fitinerary%2Ditems%2Dalt%3Fguest%2Did%2Dtype%3Dxid%26guest%2Did%2Dvalues%3D" + encodeURIComponent(localStorage.xid) + "%26guest%2Drole%3DPARTICIPANT%26local%2Dstart%2Ddate%3D" + yyyy + "%2D" + mm + "%2D" + dd + "%26item%2Dlimit%3D999&expand=entries%28.%28self%2Cguests%28.%28self%29%29%2CwdproEnterpriseContents%28.%28wdproContent%28name%2CrelatedLocations%28primaryLocations%28.%28self%29%29%2CvantagePoints%28.%28self%29%29%29%29%2CwdproLocation%29%29%2CpartyMembers%28.%28profile%29%29%2CprimaryTransactionalGuest%28profile%29%2CeventDining%28wdproEnterpriseProduct%28name%2Cself%29%29%2CshowDining%28name%2CwdproEnterpriseProduct%28name%2Cself%29%29%29%29&fields=entries%28errors%2C.%28errors%2Cguests%28.%28relationship%2CfirstName%2Crole%2ClastName%2Clinks%28wdproAvatar%29%2CguestIdentifiers%29%29%2CprimaryTransactionalGuest%28links%2Cprofile%28guestIdentifiers%2CwdproAvatar%29%29%2CeventDining%28partyMix%2CwdproEnterpriseProduct%28name,prepayRequired%29%29%2CshowDining%28partyMix%2CwdproEnterpriseProduct%28name,prepayRequired%29%29%2CpartyMembers%28.%28relationship%2Crole%2Cprofile%28firstName%2ClastName%2Clinks%28wdproAvatar%29%2CguestIdentifiers%29%29%29%2CbarCodeNumber%2CcomplimentaryTicket%2CendDateTime%2CentitlementId%2CentitlementType%2CguestType%2Cid%2Clinks%2CmagneticCodeNumber%2CpurchaseDate%2CstartDateTime%2CTDSSN%2CticketVoidCodeDescription%2CtransactionDSSN%2Ctransferable%2Ctype%2CvalidityEndDate%2CvalidityStartDate%2CaccommodationStatus%2CarrivalDateTime%2CdepartureDateTime%2CpackageEntitlement%2CpartyMix%2Cresort%2Croom%2CtransactionalGuestList%2Cguests%2Clocation%2CenterpriseContents%2CredemptionsAllowed%2CredemptionsRemaining%2CreturnWindowEndTime%2CreturnWindowStartTime%2Cstatus%2CwdproEnterpriseContents%28.%28wdproContent%28id%2Cname%2CrelatedLocations%28primaryLocations%28.%28id%2Cname%2Ccoordinates%29%29%2CvantagePoints%28.%28id%2Cname%2Ccoordinates%29%29%29%2Ccoordinates%29%2CwdproLocation%28id%2Ctype%2Cname%2CrelatedLocations%2Ccoordinates%29%29%29%2CxpassType%2CreservationNumber%29%29&ignoreMissingLinks=true";
  req.open('GET', requestUrl, true);
  req.setRequestHeader("Authorization", "BEARER " + localStorage.privateToken);
  req.timeout = httpTimeout;
  req.onload = function(e) {
    log.debug('Ready state: ' + req.readyState + ', Status: ' + req.status);
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var itineraryCount = 0;
          for (var i = 0; i < response.entries.length; i++) {
            var index = 0;
            var entry = response.entries[i];
            var startDate;
            var endDate;
            if (entry.type == "DiningReservation") {
              var diningReservation = {};
              startDate = new Date(entry.startDateTime);
              var hours = (startDate.getHours() < 10) ? "0" + startDate.getHours() : startDate.getHours();
              var mins = (startDate.getMinutes() < 10) ? "0" + startDate.getMinutes() : startDate.getMinutes();
              diningReservation.time = tConvert(hours + ":" + mins + ":00");
              diningReservation.name = entry.eventDining ? entry.eventDining.wdproEnterpriseProduct.name : entry.showDining.wdproEnterpriseProduct.name;
              diningReservation.type = "dining";
              if (today.getFullYear() == startDate.getFullYear() && today.getMonth() == startDate.getMonth() && today.getDate() == startDate.getDate()) {
                console.log(diningReservation.name);
                appMessageQueue.push({'message': {
                  'index': index,
                  'name': diningReservation.name.substring(0,50),
                  'type': diningReservation.type.substring(0,25),
                  'time': diningReservation.time.substring(0,50)
                }});
                index++;
                itineraryCount++;
              }
            } else if (entry.type == "xpass") {
              var xpassReservation = {};
              startDate = new Date(entry.startDateTime);
              endDate = new Date(entry.endDateTime);
              var startHours = (startDate.getHours() < 10) ? "0" + startDate.getHours() : startDate.getHours();
              var startMins = (startDate.getMinutes() < 10) ? "0" + startDate.getMinutes() : startDate.getMinutes();
              var endHours = (endDate.getHours() < 10) ? "0" + endDate.getHours() : endDate.getHours();
              var endMins = (endDate.getMinutes() < 10) ? "0" + endDate.getMinutes() : endDate.getMinutes();
              xpassReservation.time = tConvert(startHours + ":" + startMins + ":00") + " - " + tConvert(endHours + ":" + endMins + ":00");
              xpassReservation.name = entry.wdproEnterpriseContents[0].wdproContent.name;
              xpassReservation.type = "xpass";
              if (today.getFullYear() == startDate.getFullYear() && today.getMonth() == startDate.getMonth() && today.getDate() == startDate.getDate()) {
                console.log(xpassReservation.name);
                appMessageQueue.push({'message': {
                  'index': index,
                  'name': xpassReservation.name.substring(0,50),
                  'type': xpassReservation.type.substring(0,25),
                  'time': xpassReservation.time.substring(0,50)
                }});
                index++;
                itineraryCount++;
              }
            }
          }
          if (itineraryCount === 0) {
            // No plans for the day
            sendError("No Plans", "It looks like you have nothing scheduled for today.");
            requesting = false;
          } else {
            appMessageQueue.push({'message': {
              'type': ''
            }});
            requesting = false;
            sendAppMessage();
          }
        }
      } else if (req.status == 401) {
        // Unauthorized, login must be invalid
        sendError("Invalid Login", "Your username or password is incorrect.");
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    log.debug('Timed out');
    sendError("Oops!", "There was an error getting your itinerary.");
    requesting = false;
  };
  req.onerror = function() {
    console.log("Connection failed");
    log.debug('Error');
    sendError("Oops!", "There was an error getting your itinerary.");
    requesting = false;
  };
  req.send(null);
};

// PEBBLE APP READY
Pebble.addEventListener("ready", function(e) {
  // JS app ready
  requesting = false;
  //versionCheck('f813669a-50c6-42c4-a55b-744c6f3ca5a6', '1.7');
});

// RECEIVED APP MESSAGE
Pebble.addEventListener("appmessage", function(e) {
  console.log("Received message: " + JSON.stringify(e));
  log.debug('Received message: ' + JSON.stringify(e));
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
    requesting = false;
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
      sendError("Login Required", "Please open the Pebble app on your phone and login.");
    }
  }
});

// SHOW CONFIG WINDOW
Pebble.addEventListener("showConfiguration", function(e) {
    Pebble.openURL("http://logicalpixels.com/mde/settings.html#" + encodeURIComponent(log.getJSONLog()));
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
