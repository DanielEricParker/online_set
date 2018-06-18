//import libraries
var socket = io();

//set global variables
var connected = false;
var gameState = "finding sets";
var username = "[Username]";
//game states:
//    finding set --- waiting for a player to find a set
//    waiting for set --- another player is selecting a set
//    selecting set --- local player is selecting a set
//    game over
var cards = [];
var tableCards = [];
var deckCards = [];
var selectedCards = [];

function numToArr(number){
    var a = number % 3;
    number -= a;
    var b = (number % 9)/3;
    number -= 3*b;
    var c = (number % 27)/9;
    number -= 9*c
    var d = number/27;
    return [a,b,c,d]
}


//given the number of a card, gives its name
function cardName(card){
    var cArr= numToArr(card);
    var name = "";

    //number
    switch (cArr[0]) {
        case 0:
            name += "1 ";
            break;
        case 1:
            name += "2 ";
            break;
        case 2:
            name += "3 ";        
    }

    //filling
    switch (cArr[2]) {
        case 0:
            name += "solid ";
            break;
        case 1:
            name += "empty ";
            break;
        case 2:
            name += "shaded ";
            break;          
    }

    //color
    switch (cArr[2]) {
        case 0:
            name += "red ";
            break;
        case 1:
            name += "green ";
            break;
        case 2:
            name += "blue ";
            break;          
    }

    //shape
    switch (cArr[3]) {
        case 0:
            name += "oval ";
            break;
        case 1:
            name += "diamond ";
            break;
        case 2:
            name += "squiggle ";
            break;          
    }
    return name;
}

//tests is a card is selected
function isSelected(card){
    for (var c = 0; c < selectedCards.length; c++){
        if (selectedCards[c] == card){
            return true;
        }
    }        
    return false;
}

//function to "log in" by setting the username and telling the server
function setUsername() {
    if(connected == false){
        console.log("Setting username");
        username = $('#usernameInput').val().trim();
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
    chatMessage(data.username,data.message);
});

function chatMessage(username, message){
    var newMessage = "";
    newMessage = "<li> <b> " + username + "</b>: " + message + "</li>";

    console.log(newMessage);
    $(messages).append(newMessage);
    $("#chatmessages").scrollTop($("#chatmessages")[0].scrollHeight);
}


//function to render the cards
function renderTable(){
    console.log("Rendering cards");
    console.log(tableCards)
    tableHTML = "";
    tableHTML += "<table>\n"
    var numRows = tableCards.length/3
    // console.log("numRows:"+numRows)
    for (var row = 0; row < numRows; row++){
        // console.log("row: "+row);
        tableHTML += "<tr>\n"
            for (var col = 0; col < 3; col++){
                var c = row*3 + col;
                var cardC = tableCards[c]
                console.log("Rendering Card "+cardC + ": "+ cardName(cardC));
                // console.log("c: "+c)
                tableHTML += "<td>\n"
                if (isSelected(cardC)){
                    console.log("Rederning selected card: "+cardC);
                    tableHTML += `
                        <div class="selected">
                          ${cardName(cardC)}
                        </div>\n`;
                } else {
                    tableHTML += `
                    <div id="card_${cardC}">
                      ${cardName(cardC)}
                    </div>\n`;
                }
                tableHTML += "</td>\n"

            }
        tableHTML += "</tr>\n"
    }
    tableHTML += "</table>"  
    // $("#cards").html(tableHTML);
    $('#cards').html(tableHTML);
    $('#cards div').on("click", function(){
        var card_id = ($(this).attr('id')).substring(5);
        console.log("Clicked card " + card_id);
        selectCard(card_id);
    });
}


//function to highlight a selected card
function selectCard(card, player){
    console.log("selecting card");
    if (gameState == "finding sets"){
        socket.emit("found set");
        selectedCards.push(card);
        renderTable();
        gameState = "selecting cards";
        // console.log("Selected card "+card+": " + cardName(card))
    } else if (gameState = "selecting cards") {
        selectedCards.push(card);
        renderTable();
        console.log("Selected card "+card+": " + cardName(card))
    } else {
        chatMessage("server", "Cannot select a card right now.");
        console.log("Game state: " + gameState)
    }
    console.log("Cards selected so far: ");
    console.log(selectedCards);
    if (selectedCards.length == 3){
        socket.emit("selected set", selectedCards)
        console.log("Sent set to server.");
    }
}

socket.on("selecting set", function(){
    gameState = "waiting for set";
    chatMessage("Server",gameState);
});

socket.on("resume play", function(){
    selectedCards = [];
    gameState = "finding sets";
    renderTable(tableCards);
    chatMessage("Server","Resuming play");
});


socket.on('dealing cards', function(server_cards){
    if (connected){
        console.log("Server dealt cards.")
        console.log(server_cards);

        //store local copies
        cards = server_cards;
        console.log(cards);
        tableCards = [];
        for (var i = 0; i < 81; i++) {
          if (cards[i] == "table"){
              tableCards.push(i);
          }
        }

        deckCards = []
        for (var i = 0; i < 81; i++) {
          if (cards[i] == "deck"){
              deckCards.push(i);
          }
        }

        console.log("Table cards:")
        console.log(tableCards);

        //update the table
        renderTable(tableCards); 
    }

});



window.onload = function(){

    socket.emit('get card info');

}