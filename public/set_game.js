//import libraries
var socket = io();

//set global variables
var connected = false;

//function to "log in" by setting the username and telling the server
function setUsername() {
    if(connected == false){
        console.log("Setting username");
        var username = $('#usernameInput').val().trim();
        console.log(username)

        socket.emit('add user', username);
        connected = true
    }
};

//sets up the list of online users
//called whenever someone logs in or out
socket.on("setup", function(data){
    //the list of users
    var users = data.online_users;
    console.log(users);

    //update the html
    var usersList = "";
    for(var u = 0; u < users.length; u++){
        usersList += "<li> " + users[u]+"\n";
    }
    $(user_list).html(usersList);
});

//function to send a chat message
function sendChat() {
    console.log("Sending chat message");
    var msg = $('#inputMessage').val().trim();
    console.log(msg)
    $('#inputMessage').val("");

    socket.emit('chat message', msg);
};


//shows new chat messages
socket.on("chat message", function(data){
    console.log("New chat message");
    console.log(data);
    var newMessage = "";
    newMessage = "<li> <b> " + data.username + "</b>: " + data.message + "</li>";

    console.log(newMessage);
    $(messages).append(newMessage);
    $("#chatmessages").scrollTop($("#chatmessages")[0].scrollHeight);
});

// $(function () {
// //load libraries
// var socket = io();

// console.log("loaded script");

// //variables for forms
// var $usernameInput = $('#usernameInput');
// var $inputMessage = $('#inputMessage');

// //global variables
// var username;
// // var $currentInput = $usernameInput.focus();
// console.log($usernameInput.val());

// function setUsername() {
//   console.log("test");
//     // socket.emit('setUsername', document.getElementById('name').value);
// };

// // //logic to send a message
// // const sendMessage = () => {
// //   var message = $inputMessage.val();

// //   $inputMessage.val('');
// //   addChatMessage({
// //     username: username,
// //     message: message
// //   });
// //   socket.emit('new message', message);
// // }

// // //logic to update the list of messages
// // const addChatMessage = (data) => {
// //   console.log("New chat message:")
// //   console.log(data)
// //   msg = $('<li>').text(data.username)
// //   msg.append(": ")
// //   msg.append(text(data.message))
// //   $('#messages').append(msg);
// // }

// $(document).ready(function () {
//   console.log("Ready");
//   $('.submitUsername').on("submit", function(){
//       console.log("click on the button");
//       return false;
//   });
// });
// // });
// // $('form').submit(function(){
// //   socket.emit('chat message', $('#m').val());
// //   $('#m').val('');
// //   return false;
// // });
// //   socket.on('chat message', function(msg){
// //   $('#messages').append($('<li>').text(msg));
// // });
// });