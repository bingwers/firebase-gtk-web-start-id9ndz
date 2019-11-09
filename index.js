// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const questionaireForm = document.getElementById('questionaire');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyB9XIsGGfVnyNRp3jAFw88Xal9smnBg6mk",
    authDomain: "fir-workshop-test.firebaseapp.com",
    databaseURL: "https://fir-workshop-test.firebaseio.com",
    projectId: "fir-workshop-test",
    storageBucket: "fir-workshop-test.appspot.com",
    messagingSenderId: "879011283348",
    appId: "1:879011283348:web:ce08458486b3cbec4c4f81"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
// var firebaseConfig = {};

// firebase.initializeApp(firebaseConfig);
const ui = new firebaseui.auth.AuthUI(firebase.auth());

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl){
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

// Called when the user clicks the RSVP button
startRsvpButton.addEventListener("click",
 () => {
    if (firebase.auth().currentUser) {
      // User is signed in; allows user to sign out
      firebase.auth().signOut();
    } else {
      // No user is signed in; allows user to sign in
      ui.start("#firebaseui-auth-container", uiConfig);
    }
});

// ...
// Listen to the current Auth state
firebase.auth().onAuthStateChanged((user) => {
if (user){
  startRsvpButton.textContent = "LOGOUT";
  // Show guestbook to logged-in users
  guestbookContainer.style.display = "block";

  // Subscribe to the guestbook collection
  subscribeGuestbook();
}
else{
  startRsvpButton.textContent = "RSVP";
  // Hide guestbook for non-logged-in users
  guestbookContainer.style.display = "none";

  // Unsubscribe from the guestbook collection
  unsubscribeGuestbook();
}
});

// Listen to the form submission
form.addEventListener("submit", (e) => {
 // Prevent the default form redirect
 e.preventDefault();
 // Write a new message to the database collection "guestbook"
 firebase.firestore().collection("guestbook").add({
   text: input.value,
   timestamp: Date.now(),
   name: firebase.auth().currentUser.displayName,
   userId: firebase.auth().currentUser.uid
 })
 // clear message input field
 input.value = ""; 
 // Return false to avoid redirect
 return false;
});

firebase.auth().onAuthStateChanged((user) => {
 if (user){
   startRsvpButton.textContent = "LOGOUT";
   // Show guestbook to logged-in users
   guestbookContainer.style.display = "block";
   getAndDisplayMatches();

   firebase.firestore().collection("questionaires")
    .orderBy("timestamp","desc").onSnapshot((snaps) => {
      getAndDisplayMatches();
  });
 }
 else{
   startRsvpButton.textContent = "RSVP";
   // Hide guestbook for non-logged-in users
   guestbookContainer.style.display = "none";
 }
});

// Create query for messages
firebase.firestore().collection("guestbook")
  .orderBy("timestamp","desc")
  .onSnapshot((snaps) => {
  // Reset page
  guestbook.innerHTML = "";
  // Loop through documents in database
  snaps.forEach((doc) => {
    // Create an HTML entry for each document and add it to the chat
    const entry = document.createElement("p");
    entry.textContent = doc.data().name + ": " + doc.data().text;
    guestbook.appendChild(entry);
  });
});

// Listen to guestbook updates
function subscribeGuestbook(){
   // Create query for messages
 guestbookListener = firebase.firestore().collection("guestbook")
 .orderBy("timestamp","desc")
 .onSnapshot((snaps) => {
   // Reset page
   guestbook.innerHTML = "";
   // Loop through documents in database
   snaps.forEach((doc) => {
     // Create an HTML entry for each document and add it to the chat
     const entry = document.createElement("p");
     entry.textContent = doc.data().name + ": " + doc.data().text;
     guestbook.appendChild(entry);
   });
 });
};

function unsubscribeGuestbook(){
 if (guestbookListener != null)
 {
   guestbookListener();
   guestbookListener = null;
 }
};

function sq(x) {
    return x*x;
}

function displayProfile(userId, domElem) {
  var profile = {};

  console.log("Retreiving profile for " + userId);
  firebase.firestore().collection("questionaires").doc(userId).get().then(
    function(doc) {
      if (doc.exists) {
        profile.name = doc.data().name;
      }
      else {
        profile.name = "none";
      }

      domElem.innerHTML = profile.name;
      domElem.innerHTML += "<button id='chat_with_" + doc.data().userId + "'>chat</button>";
    }
  );
};

function displayMatches(userId, scores, matchesContainer) {

  firebase.firestore().collection("questionaires").get().then( function(querySnapshot) {
    var matches = [];

      querySnapshot.forEach(function(doc) {
        if (doc.data().userId != userId) {
          var elem;
          var diff = sq(Number(doc.data().q1) - scores[0])
            + sq(Number(doc.data().q2) - scores[1])
            + sq(Number(doc.data().q3) - scores[2]);
          var l = matches.length;
          var i;
          var match = {userId: doc.data().userId, diff: diff};
          for (i = 0; i < l; i++) {
            if (diff > matches[i].diff) {
              matches.splice(i, 0, match);
              break;
            }
          }
          if (i == l && l < 5) {
            matches.push(match);
          }

          if (matches.length > 5) {
            matches.pop();
          }
        }
      }
      );

      matchesContainer.innerHTML = "";
      matches.forEach(
        function(item) {
          var domElem = document.createElement("li");
          matchesContainer.appendChild(domElem);
          displayProfile(item.userId, domElem);
        }
      );
    }
  );
};

// Listen to the form submission
questionaireForm.addEventListener("submit", (e) => {
  // Prevent the default form redirect
  e.preventDefault();

  var q1 = document.getElementById("q1").value;
  var q2 = document.getElementById("q2").value;
  var q3 = document.getElementById("q3").value;

  // Write a new message to the database collection "guestbook"
  firebase.firestore().collection("questionaires").doc(firebase.auth().currentUser.uid).set({
    q1: document.getElementById("q1").value,
    q2: document.getElementById("q2").value,
    q3: document.getElementById("q3").value,
    timestamp: Date.now(),
    name: firebase.auth().currentUser.displayName,
    userId: firebase.auth().currentUser.uid
  });

  var matchesContainer = document.getElementById("matches-display");
  //var matches = displayMatches(firebase.auth().currentUser.uid, [q1, q2, q3], matchesContainer);

  document.getElementById("q1").value = "";
  document.getElementById("q2").value = "";
  document.getElementById("q3").value = "";
  // Return false to avoid redirect
  return false;
});

function getAndDisplayMatches() {
  firebase.firestore().collection("questionaires").doc(firebase.auth().currentUser.uid).get().then(
    function(doc) {
      if (doc.exists) {
        matches = [
          doc.data.q1,
          doc.data.q2,
          doc.data.q3
        ];

        var matchesContainer = document.getElementById("matches-display");
        var matches = displayMatches(firebase.auth().currentUser.uid, [q1, q2, q3], matchesContainer);
      }
    }
  );
}

var createChat = function(withUserId) {
  var userId = firebase.auth().currentUser.uid;
  var possibleChats = firebase.firestore().collection("chats").where("people", "array-contains", userId);

  possibleChats.get().then(
    function(querySnapshot) {
      console.log("MADE QUERY");
      console.log(querySnapshot);
      querySnapshot.forEach(
        function(doc) {
          // doc.data() is never undefined for query doc snapshots
            console.log(doc.data());

          if (doc.data().people.indexOf(withUserId) != -1) {
            var docId = doc.id;
            
          }
        }
      );
    }
  );
};

// const ui = new firebaseui.auth.AuthUI(firebase.auth());
