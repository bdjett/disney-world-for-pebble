// getPrivateToken
// --------------
// Get a private token for itinerary access
var getPrivateToken = function() {
  var req = new XMLHttpRequest();
  var requestUrl = "https://authorization.go.com/token?client_id=WDPRO-MOBILE.MDX.WDW.IOS-PROD&client_secret=&grant_type=password&password=" + encodeURIComponent(localStorage.password) + "&scope=RETURN_ALL_CLIENT_SCOPES&username=" + encodeURIComponent(localStorage.username);
  req.timeout = httpTimeout;
  req.open('POST', requestUrl, false);
  req.onload = function(e) {
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
  };
  req.onerror = function() {
    console.log("Connection failed");
  };
  req.send(null);
};

// getXID
// ------
// Get a user's xid from their swid
var getXID = function() {
  getPrivateToken();
  var req = new XMLHttpRequest();
  var requestUrl = "https://disneyparks.api.go.com/assembly/guest/id;swid=" + encodeURIComponent(localStorage.swid) + "/profile";
  req.setRequestHeader("Authorization", "BEARER " + localStorage.privateToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, false);
  req.onload = function(e) {
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
  };
  req.onerror = function() {
    console.log("Connection failed");
  };
  req.send(null);
};

// getItinerary
// ------------
// Get guests itinerary
var getItinerary = function() {
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
  console.log(dd);
  var requestUrl = "https://disneyparks.api.go.com/expand-service/expand?url=https%3A%2F%2Fdisneyparks%2Eapi%2Ego%2Ecom%2Fassembly%2Fitinerary%2Ditems%2Dalt%3Fguest%2Did%2Dtype%3Dxid%26guest%2Did%2Dvalues%3D" + encodeURIComponent(localStorage.xid) + "%26guest%2Drole%3DPARTICIPANT%26local%2Dstart%2Ddate%3D" + yyyy + "%2D" + mm + "%2D" + dd + "%26item%2Dlimit%3D999&expand=entries%28.%28self%2Cguests%28.%28self%29%29%2CwdproEnterpriseContents%28.%28wdproContent%28name%2CrelatedLocations%28primaryLocations%28.%28self%29%29%2CvantagePoints%28.%28self%29%29%29%29%2CwdproLocation%29%29%2CpartyMembers%28.%28profile%29%29%2CprimaryTransactionalGuest%28profile%29%2CeventDining%28wdproEnterpriseProduct%28name%2Cself%29%29%2CshowDining%28name%2CwdproEnterpriseProduct%28name%2Cself%29%29%29%29&fields=entries%28errors%2C.%28errors%2Cguests%28.%28relationship%2CfirstName%2Crole%2ClastName%2Clinks%28wdproAvatar%29%2CguestIdentifiers%29%29%2CprimaryTransactionalGuest%28links%2Cprofile%28guestIdentifiers%2CwdproAvatar%29%29%2CeventDining%28partyMix%2CwdproEnterpriseProduct%28name,prepayRequired%29%29%2CshowDining%28partyMix%2CwdproEnterpriseProduct%28name,prepayRequired%29%29%2CpartyMembers%28.%28relationship%2Crole%2Cprofile%28firstName%2ClastName%2Clinks%28wdproAvatar%29%2CguestIdentifiers%29%29%29%2CbarCodeNumber%2CcomplimentaryTicket%2CendDateTime%2CentitlementId%2CentitlementType%2CguestType%2Cid%2Clinks%2CmagneticCodeNumber%2CpurchaseDate%2CstartDateTime%2CTDSSN%2CticketVoidCodeDescription%2CtransactionDSSN%2Ctransferable%2Ctype%2CvalidityEndDate%2CvalidityStartDate%2CaccommodationStatus%2CarrivalDateTime%2CdepartureDateTime%2CpackageEntitlement%2CpartyMix%2Cresort%2Croom%2CtransactionalGuestList%2Cguests%2Clocation%2CenterpriseContents%2CredemptionsAllowed%2CredemptionsRemaining%2CreturnWindowEndTime%2CreturnWindowStartTime%2Cstatus%2CwdproEnterpriseContents%28.%28wdproContent%28id%2Cname%2CrelatedLocations%28primaryLocations%28.%28id%2Cname%2Ccoordinates%29%29%2CvantagePoints%28.%28id%2Cname%2Ccoordinates%29%29%29%2Ccoordinates%29%2CwdproLocation%28id%2Ctype%2Cname%2CrelatedLocations%2Ccoordinates%29%29%29%2CxpassType%2CreservationNumber%29%29&ignoreMissingLinks=true";
  req.setRequestHeader("Authorization", "BEARER " + localStorage.privateToken);
  req.timeout = httpTimeout;
  req.open('GET', requestUrl, true);
  req.onload = function(e) {
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
              diningReservation.name = entry.eventDining.wdproEnterpriseProduct.name;
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
          if (itineraryCount == 0) {
            // No plans for the day
            sendError("No Plans", "It looks like you have nothing scheduled for today.");
          } else {
            appMessageQueue.push({'message': {
              'type': ''
            }});
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
    sendError("Oops!", "There was an error getting your itinerary.");
  };
  req.onerror = function() {
    console.log("Connection failed");
    sendError("Oops!", "There was an error getting your itinerary.");
  };
  req.send(null);
};