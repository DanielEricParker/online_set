//
// Main file for the server-side javascript.
// 
//
//

//used some code from https://scotch.io/tutorials/a-realtime-room-chat-app-using-node-webkit-socket-io-and-mean#the-server


//************** LIBRARIES ******************

var express = require('express');
// var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


//tell express where static files live
app.use(express.static(__dirname+'/public'));


// ****************** ROUTES *******************//

//route for the index file
app.get('/',function(req,res) {
	//set the index for the public directory
	res.sendfile('index.html');
});

// ************* global variables and game code ************* //
// This is the actual game code. Everything else is client-server communications.


//there are 4 attributes, each with 3 values for a total of 81 cards
//these are most conveniently thought of as vectors in Z_3^4
//i.e. they should be represented at 4-digit trinary numbers
//but it's more convenient to represent everything as a single number and convert back and forth because javascript is silly


var cards = new Array(81);//maps only work with new browsers apparently
//keys are number 0 to 80
//values are:
//	 "deck" if the card is in the deck
//	 "table" if in play
//	 "user_[username]" if already collected
for(var i = 0; i < 81; i++){
	cards[i]="deck";
}
var deckSize = cards.length;
var tableSize = 0;
var gameOver = false;

var users = {}


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

//converts a trinary array of 4 digits to a number
function arrToNum(arr){
	return arr[0] + 3*arr[1] + 9*arr[2] + 27*arr[3];
}


//given the number of a card, gives its name
function cardName(card){
    var cArr= numToArr(card);
    var name = "";
    //number
    numbers = ["1_","2_","3_"];
    shades = ["solid_","empty_","shaded_"];
    colors = ["red_","green_","blue_"];
    shapes = ["oval","diamond","squiggle"];

    name +=  numbers[cArr[0]];
    name +=  shades[cArr[1]];
    name +=  colors[cArr[2]];
    name +=  shapes[cArr[3]];

    return name;
}

//testing
// console.log(arrToNum([1,0,0,0]))
// console.log(arrToNum([1,2,2,2]))

// console.log(numToArr(5))
// console.log(numToArr(10))
// console.log(numToArr(14))
// console.log(numToArr(79))



//function to draw cards randomly from the deck
//modifies the cards array
function drawCards(numberToDraw){
	//find the cards in the deck
	var deckCards = [];
	for (var i = 0; i < 81; i++) {
	  if (cards[i] == "deck"){
	  	deckCards.push(i);
	  }
	}

	for (var i = 0; i < numberToDraw; i++){
		// console.log("Deck:");
		// console.log(cards);

		var rand = deckCards[Math.floor((Math.random() * deckSize))];
		// console.log("Choose card "+ rand);
		cards[rand] = "table";
		// console.log("Drew card: " + cardName(rand));

		//remove cards from deck list
		var rand_index = deckCards.indexOf(rand);
		if (rand_index > -1) {
		  deckCards.splice(rand_index, 1);
		}

		//increment global counters
		deckSize--;
		tableSize++;
	}
	console.log("There are "+ deckSize +" cards in the deck.");
}

//testing:
// drawCards(3)
// console.log("Deck:");
// console.log(cards);
// console.log([1,2,3]+[4,5,6]);
// console.log(cards);

//function to check if 3 cards compose a set
// if c1,c2,c3 in Z_3^4 are cards, then
// then form a set iff each attribute is all the same or all different
// i.e. c1+c2+c3 ~ [0,0,0,0] in Z_3^4
// this is because all the same for an attribute is
// 0+0+0~0 or 1+1+1=3~0 or 2+2+2=6~0, while all different is
// 0+1+2=3~0
function checkSet(card1, card2, card3){
	// console.log("Checking set: ")
	// console.log(cardName(arrToNum(card1)));
	// console.log(cardName(arrToNum(card2)));
	// console.log(cardName(arrToNum(card3)));
	if( (card1[0] + card2[0] + card3[0])%3 ==0){
		if( (card1[1] + card2[1] + card3[1])%3 ==0){
			if( (card1[2] + card2[2] + card3[2])%3 ==0){
				if( (card1[3] + card2[3] + card3[3])%3 ==0){
					return true;
				}
			}
		}
	}
	return false;
}
//testing
// console.log(checkSet([0,0,0,0],[1,1,1,1],[2,2,2,2]))
// console.log(checkSet([0,0,0,0],[1,1,1,1],[2,2,2,1]))
// console.log(checkSet([0,0,0,0],[0,1,0,0],[0,2,0,0]))

//function to check if there are any set on the table
function checkSetsOnTable(){
	//get all the cards on the table
	var tableCards = [];
	for (var i = 0; i < 81; i++) {
	  if (cards[i] == "table"){
	  	tableCards.push(i);
	  }
	}

	console.log("There are "+ tableCards.length +" cards on the table.");

	for (var i = 0; i < tableSize; i++){
		var c1 = numToArr(tableCards[i]);
		for (var j = 0; j < i; j++){
			var c2 = numToArr(tableCards[j]);
			for (var k = 0; k < j; k++){
				// console.log([i,j,k]);
				var c3 = numToArr(tableCards[k]);
				if(checkSet(c1,c2,c3)){
					console.log("Set on the table: ");
					console.log(cardName(arrToNum(c1)));
					console.log(cardName(arrToNum(c2)));
					console.log(cardName(arrToNum(c3)));
					return true;
				}
			}
		}
	}
	return false;
}
//testing
// drawCards(5);
// console.log(cards);
// console.log(checkSetsOnTable());


//function to collect a set for a certain player
//and associated logic
function collect_set(user, c1,c2,c3){
	console.log("Possible set from " + user+":" + c1 + " " + c2 + " " + c3);

	//check if this really is a set
	if (cards[c1] == "table"
	 	&& cards[c2] == "table"
	 	&& cards[c3] == "table" 
	 	&& checkSet(numToArr(c1),numToArr(c2),numToArr(c3))
		){

		console.log("Set! "+[c1,c2,c3]);
		//if so
		//assign those cards to that player
		var username = "user_"+user;
		cards[c1] = username;
		cards[c2] = username;
		cards[c3] = username;
		tableSize -= 3;
		users[user] += 3;
		console.log("Assigned set to player " + user);

		dealCards();
		console.log("game over [in collect]? = "+ gameOver)
		return true;
	} else {
		console.log("Not a set. =(");
		return false;
	}
}

//function to determine how many cards to deal
//recognizes if the game has ended if needed

//this needs to be rewritten more efficiently
function dealCards(){
		//if there are no cards and no sets left, end the game
		//if there are no cards, but a set left, do nothing
		//if there are < 12 cards, draw
		//if there is no set, draw
		var anySets = checkSetsOnTable();

		while (tableSize < 12 || !anySets){
			if (deckSize == 0 && !anySets){
				console.log("Dealing....the game is over");
				gameOver = true;
				console.log(gameOver)
				return false;
			} else if (deckSize == 0 && anySets) {
				console.log("Dealing...there must still be a set left");
				return true;
			} else {
				console.log("Dealing..draw cards, rinse, and repeat.");
				drawCards(3);
			}
			anySets = checkSetsOnTable();

		}
}


//function to set up a new game and initialize default values;
function resetGlobals(){
	for(var i = 0; i < 81; i++){
		cards[i]="deck";
	}
	deckSize = cards.length;
	tableSize = 0;

	//reset scores
	for (var user in users) {
        if (users.hasOwnProperty(user)) {
           users[user] = 0;
        }
    }
	gameOver = false;

	dealCards();
}



// ************** Sockets *********************//




//wait for connections
io.on('connection', function(socket) {

	//listen for new users
	socket.on('add user', function(username){
		console.log("New user "+username+" connected.");
		socket.user = username;
		users[username] = 0;
		//emit list of online users
		console.log(users);
		updateUsersList();
		socket.emit('dealing cards', cards);

	});

	//listen for disconnect
	socket.on('disconnect',() => {
		console.log();
		console.log("User '"+socket.user+"' disconnected");
		//remove rom users list.

		delete users[socket.user]

		updateUsersList();
		console.log(users);
	});

	//listen for a new chat message
	socket.on('chat message', function(msg) {
		console.log("New chat message: " + msg)
		//create message
		var newMsg = {
			username: socket.user,
			message: msg,
			timestamp: new Date()
		};
		console.log(newMsg);
		io.emit('chat message', newMsg);
	});

	function updateUsersList(){
		io.emit('setup', users);
	}



	//a player selected a set 
	socket.on('selected set', function(set) {
		console.log("Player " + socket.user + " submitted a set: "+set);
		console.log(cardName(set[0]))
		console.log(cardName(set[1]))
		console.log(cardName(set[2]))

		var isSet = collect_set(socket.user, set[0], set[1], set[2]);
		console.log("is it a set?"+isSet)
		console.log("game over? = "+gameOver)
		if (gameOver){
				console.log("looking like the game is over. Scoring...");
				scoreGame();
		} else {
			if (isSet){
				sendBoard();
				updateUsersList();
				io.emit('resume play',{user: socket.user, set: set});
			} else {
				socket.emit('resume play',{user: socket.user, set: []});
			}
		}
	});


	socket.on('get board', function(){
		sendBoard();
	});

	//function to tell the players what cards are currently on the table
	function sendBoard(){
		io.emit('dealing cards', cards);
	}

	//function called at the end of the game to score it and notify the players
	function scoreGame(){
		io.emit('game ended');
		newGame();
	}

	function newGame(){
		resetGlobals();
		io.emit('new game');
		updateUsersList();
	}

	//cheating function for debuggin
	// socket.on('take set', function(set){
	// 	console.log("Taking a set for the player.")
	// 	var tableCards = [];
	// 	for (var i = 0; i < 81; i++) {
	// 	  if (cards[i] == "table"){
	// 	  	tableCards.push(i);
	// 	  }
	// 	}
	// 	var set = []
	// 	console.log("There are "+ tableCards.length +" cards on the table.");

	// 	for (var i = 0; i < tableSize; i++){
	// 		var c1 = numToArr(tableCards[i]);
	// 		for (var j = 0; j < i; j++){
	// 			var c2 = numToArr(tableCards[j]);
	// 			for (var k = 0; k < j; k++){
	// 				// console.log([i,j,k]);
	// 				var c3 = numToArr(tableCards[k]);
	// 				if(checkSet(c1,c2,c3)){
	// 					set = [arrToNum(c1),arrToNum(c2),arrToNum(c3)];
	// 				}
	// 			}
	// 		}
	// 	}

	// 	collect_set(socket.user, set[0], set[1], set[2]);
	// 	sendBoard();
	// 	updateUsersList();
	// 	io.emit('resume play',{user: socket.user, set: set});
	// });


});


// ************** SERVER **************//

//start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
resetGlobals();
