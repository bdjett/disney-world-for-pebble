// getPublicToken
// --------------
// Get a public token for use in wait times
var getPublicToken = function() {
  var req = new XMLHttpRequest();
  var requestUrl = "https://authorization.go.com/token?assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.IOS-PROD&client_secret=&grant_type=assertion";
  req.timeout = httpTimeout;
  req.open('POST', requestUrl, false);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          localStorage.publicToken = response.access_token;
          console.log(req.responseText);
        }
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
  };
  req.onerror = function() {
    console.log("Connection failed");
  };
  req.send(null);
};

// getWaitTimes
// ------------
// Get wait times for given park id
var getWaitTimes = function(park) {
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/facility-service/theme-parks/" + park + "/wait-times?fields=entries(.(id,name,type,waitTime(postedWaitMinutes,rollUpWaitTimeMessage,status,fastPass(available,startTime))))";
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, false);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var entries = response.entries;
          var attractions = [];
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var attraction = {};
            attraction.name = entry.name.substring(0,20);
            attraction.id = entry.id;
            if (entry.waitTime.postedWaitMinutes !== undefined) {
              attraction.waitTime = entry.waitTime.postedWaitMinutes + " minutes";
            } else {
              attraction.waitTime = entry.waitTime.rollUpWaitTimeMessage.substring(0,30);
            }
            if (entry.type == "Attraction") {
              attractions.push(attraction);
            }
          }
          attractions.sort(function(a, b) {
            return (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
          });
          attractions.forEach(function(element, index, array) {
            appMessageQueue.push({'message': {
              'index': index,
              'id': element.id,
              'name': element.name,
              'waitTime': element.waitTime
            }});
          });
          appMessageQueue.push({'message': {
            'name': "",
            'waitTime': ""
          }});
          sendAppMessage();
        }
      } else if (req.status == 401) {
        // Unauthorized, publicToken must be expired, request a new one and try again
        getPublicToken();
        getWaitTimes(park);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    sendError("There was an error getting wait times");
  };
  req.onerror = function() {
    console.log("Connection failed");
    sendError("There was an error getting wait times");
  };
  req.send(null);
};

// getAttractionInfo
// -----------------
// Given an attraction ID, returns information about it
var getAttractionInfo = function(attractionId) {
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  console.log(attractionId);
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/attractions/" + attractionId;
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, true);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var desc = "";
          var land = "";
          if (response.descriptions !== undefined) {
            desc = response.descriptions.shortDescriptionMobile.text;
          }
          if (response.links.ancestorLand !== undefined) {
            land = response.links.ancestorLand.title;
          }
          appMessageQueue.push({'message': {
            'name': response.name,
            'location': land,
            'description': desc.substring(0,200)
          }});
          sendAppMessage();
        }
      } else if (req.status == 401) {
        // Unauhtorized, public token must be expired, request new one and try again
        getPublicToken();
        getAttractionInfo(attractionId);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    sendError("There was an error getting the attraction info");
  };
  req.onerror = function() {
    console.log("Connection failed");
    sendError("There was an error getting the attraction info");
  };
  req.send(null);
};

// getEntertainment
// ------------
// Get entertainment for park id
var getEntertainment = function(park) {
  if (!localStorage.publicToken) {
    getPublicToken();
  }
  var req = new XMLHttpRequest();
  var requestUrl = "https://api.wdpro.disney.go.com/facility-service/theme-parks/" + park + "/wait-times?fields=entries(.(id,name,type,waitTime(postedWaitMinutes,rollUpWaitTimeMessage,status,fastPass(available,startTime))))";
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, false);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        if (req.responseText) {
          var response = JSON.parse(req.responseText);
          var entries = response.entries;
          var attractions = [];
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var attraction = {};
            attraction.name = entry.name.substring(0,20);
            attraction.id = entry.id;
            if (entry.waitTime.postedWaitMinutes !== undefined) {
              attraction.waitTime = entry.waitTime.postedWaitMinutes + " minutes";
            } else {
              attraction.waitTime = entry.waitTime.rollUpWaitTimeMessage.substring(0,30);
            }
            if (entry.type == "Entertainment") {
              attractions.push(attraction);
            }
          }
          attractions.sort(function(a, b) {
            return (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
          });
          attractions.forEach(function(element, index, array) {
            appMessageQueue.push({'message': {
              'index': index,
              'id': element.id,
              'name': element.name,
              'entertainmentStatus': element.waitTime
            }});
          });
          appMessageQueue.push({'message': {
            'name': "",
            'entertainmentStatus': ""
          }});
          sendAppMessage();
        }
      } else if (req.status == 401) {
        // Unauthorized, get new public token
        getPublicToken();
        getEntertainment(park);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    sendError("There was an error getting the entertainment attractions");
  };
  req.onerror = function() {
    console.log("Connection failed");
    sendError("There was an error getting the entertainment attractions");
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
  req.setRequestHeader("Authorization", "BEARER " + localStorage.publicToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, true);
  req.onload = function(e) {
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
              'name': response.name,
              'scheduleTime': element
            }});
          });
          appMessageQueue.push({'message': {
            'scheduleTime': ""
          }});
          sendAppMessage();
        }
      } else if (req.status == 401) {
        // Unauthorized, get new public token
        getPublicToken();
        getSchedule(attractionId);
      }
    }
  };
  req.ontimeout = function() {
    console.log("Timed out");
    sendError("There was an error getting the attraction schedule");
  };
  req.onerror = function() {
    console.log("Connection failed");
    sendError("There was an error getting the attraction schedule");
  };
  req.send(null);
};