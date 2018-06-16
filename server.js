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

// let's not use a database for now

// //connect to the database
// mongoose.connect("mongodb://localhost:27017/online-set");



// //create a schema for chat
// var ChatSchema = mongoose.Schema({
// 	timestamp: Date,
// 	username: String,
// 	message: String
// });


// //create a model ("table") with the given schema
// var Chat = mongoose.model('Chat',ChatSchema)



// // allow CORS
// //I'm not sure what this is for yet.
// app.all('*', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
//   if (req.method == 'OPTIONS') {
//     res.status(200).end();
//   } else {
//     next();
//   }
// });


// ****************** ROUTES *******************//

//route for the index file
app.get('/',function(req,res) {
	//set the index for the public directory
	res.sendfile('index.html');
});

//route for grabbing messages from the database
//this seems a bit over-built to me
app.get('/msg', function(req, res) {
	Chat.find().exec(function(err, messages) {
		//return messages
		res.json(messages);		
	});	
});


// ************* global variables and game code ************* //
// This is the actual game code. Everything else is client-server communications.


//there are 4 attributes, each with 3 values for a total of 81 cards
//these are most conveniently thought of as vectors in Z_3^4
//i.e. they should be represented at 4-digit trinary numbers
//but it's more convenient to represent everything as a single number and convert back and forth because javascript is silly


var cards = new Map();//maps only work with new browsers apparently
//keys are number 0 to 80
//values are:
//	 "deck" if the card is in the deck
//	 "table" if in play
//	 "user_[username]" if already collected
for(var i = 0; i < 10; i++){
	cards.set(i,"deck");
}
var deckSize = cards.size;
var numTableCards = 0;
var scores = new Map();

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
	for (var [card, place] of cards.entries()) {
	  if (place == "deck"){
	  	deckCards.push(card);
	  }
	}
	console.log("There are "+ deckSize +" cards in the deck.");

	for (var i = 0; i < numberToDraw; i++){
		console.log("Deck:");
		console.log(cards);

		var rand = deckCards[Math.floor((Math.random() * deckSize))];
		console.log("Choose card "+ rand);
		cards.set(rand,"table");

		//remove cards from deck list
		var rand_index = deckCards.indexOf(rand);
		if (rand_index > -1) {
		  deckCards.splice(rand_index, 1);
		}

		//increment global counters
		deckSize--;
		numTableCards++;
	}
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
	for (var [card, place] of cards.entries()) {
		if (place == "table"){
			tableCards.push(card);
		}
	}
	console.log("There are "+ tableCards.length +" cards on the table.");

	for (var i = 0; i < numTableCards; i++){
		var c1 = numToArr(tableCards[i]);
		for (var j = 0; j < i; j++){
			var c2 = numToArr(tableCards[j]);
			for (var k = 0; k < j; k++){
				console.log([i,j,k]);
				var c3 = numToArr(tableCards[k]);
				if(checkSet(c1,c2,c3)){
					console.log(c1,c2,c3);
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
	//check if this really is a set
	if (checkSet(numToArr(c1),numToArr(c2),numToArr(c3))){
		console.log("Set! "+[c1,c2,c3]);
		//if so
		//assign those cards to that player
		var username = "user_"+user;
		cards.set(c1,username);
		cards.set(c2,username);
		cards.set(c2,username);
		numTableCards -= 3; 
		if scores.has(username){
			scores.set(username,3+scores.get(username));
		}
		else {
			scores.set(username,3);
		}


		console.log("Assigned set to player " + hand_name);
		console.log(cards);

		//if there are fewer than 12 cards on the board,
		//or no sets, then draw
		var anySets = checkSetsOnTable();
		while (numTableCards < 12 || !anySets){
			console.log("No sets and less than 12 cards on the table.")
			if (deckSize > 0){
				//draw cards. There must be at least 3
				console.log("Drawing 3 cards.")
				drawCards(3);
				console.log(cards);
			} elseif (anySets){
				//there are < 12 cards and none in the deck,
				//but still a set is still on the table
				console.log("No cards in the deck, but set on the table.");				
				return true;
			} else {
				//no cards left, so the game ends
				console.log("No cards left. Scoring game.")
				scoreGame();
				return true;
			}
			anySets = checkSetsOnTable();
		}
		return true;
	} else {
		return false;
	}
}

//function to score the game after it has concluded
function scoreGame(){
	return scores;
}

// ************** Sockets *********************//



// set global variables
var online_users = []

//wait for connections
io.on('connection', function(socket) {

	//listen for new users
	socket.on('add user', function(username){
		console.log("New user "+username+" connected.");
		socket.user = username;
		online_users.push(username)
		//emit list of online users
		console.log(online_users)
		updateUsersList();
	});

	//listen for disconnect
	socket.on('disconnect',() => {
		console.log();
		console.log("User '"+socket.user+"' disconnected");
		//remove rom users list.

		var userindex = online_users.indexOf(socket.user);
		if (userindex > -1) {
		  online_users.splice(userindex, 1);
		}
		updateUsersList();
		console.log(online_users);
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
		io.emit('setup', {
			online_users: online_users
		});
	}

});



// ************** SERVER **************//

//start the server
server.listen(3000);