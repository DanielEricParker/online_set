//
// Main file for the server-side javascript.
// 
//
//

//used some code from https://scotch.io/tutorials/a-realtime-room-chat-app-using-node-webkit-socket-io-and-mean#the-server


//************** LIBRARIES ******************

var express = require('express');
var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


//tell express where static files live
app.use(express.static(__dirname+'/public'));

//connect to the database
mongoose.connect("mongodb://localhost:27017/online-set");



//create a schema for chat
var ChatSchema = mongoose.Schema({
	timestamp: Date,
	username: String,
	message: String
});


//create a model ("table") with the given schema
var Chat = mongoose.model('Chat',ChatSchema)



// allow CORS
//I'm not sure what this is for yet.
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});


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

// ************** Sockets *********************//

//wait for connections
io.on('connection', function(socket) {

	// set global variables
	var online_users = []

	//emit list of online users
	socket.emit('setup', {
		online_users: online_users
	});

	//listen for new users
	socket.on('new user', function(data){
		console.log('a user connected');
	});

	//listen for disconnect
	socket.on('disconnect',function(){
		console.log('user disconnected');
	});

	//listen for a new chat message
	socket.on('new message', function(data) {
		//create message
		var newMsg = new Chat({
			username: data.username,
			content: data.message,
			timestamp: new Date()
		});
		newMsg.save(function(err,msg){
			//send message to those connected
			io.emit('chat message', msg);
		})
	});
});



// ************** SERVER **************//

//start the server
server.listen(3000);