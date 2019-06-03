// Smooth scroll
var chat;
var username = $("#user_name").text();
var socket;

// Socket Connection
$( document ).ready(function(){
namespace = "/api/chat";
socket = io.connect(
  location.protocol + "//" + document.domain + ":" + location.port + namespace
);
  // Cleanup
socket.emit("join", {room:'1', name:username})

window.onbeforeunload = function() {
// socket.emit("leave", {room:'1'})
  socket.disconnect()
};

socket.on('message', function(message) {
    chat.user = message.user;
    chat.messageToSend = message.msg;
    chat.response = true;
    chat.render()
});


socket.on('status', function(message) {
    console.log(message.msg)
});

socket.on("connection_response", function(msg) {
  console.log(msg.running_process);
});
});


(function(){

    chat = {
	messageToSend: '',
	user: username,
	response: false,
	init: function() {
	    this.cacheDOM();
	    this.bindEvents();
	    this.render();
	},
	cacheDOM: function() {
	    this.$chatHistory = $('.chat-history');
	    this.$button = $('button');
	    this.$textarea = $('#message-to-send');
	    this.$chatHistoryList =  this.$chatHistory.find('ul');
	},
	bindEvents: function() {
	    this.$button.on('click', this.addMessage.bind(this));
	    this.$textarea.on('keyup', this.addMessageEnter.bind(this));
	},
	render: function() {
	    this.scrollToBottom();
	    var template;

	    if (this.messageToSend.trim() == '') {
		return
	    }
	    if (this.response == false) {
		template = Handlebars.compile( $("#message-template").html());

	    } else {
		// responses
		template = Handlebars.compile( $("#message-response-template").html());
	    };

	    var context = {
		response: this.messageToSend,
		time: this.getCurrentTime(),
		user: username
	    };
	    console.log(context);
	    this.$chatHistoryList.append(template(context));
	    this.scrollToBottom();
	    this.$textarea.val('');
	},

	addMessage: function() {
	    this.response = false
	    this.messageToSend = this.$textarea.val()
	    this.render()
	    socket.emit('text', {msg:this.messageToSend, room:'1'})
	},
	addMessageEnter: function(event) {
	    // enter was pressed
	    if (event.keyCode === 13) {
		this.addMessage();
	    }
	},
	scrollToBottom: function() {
	    this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
	},
	getCurrentTime: function() {
	    return new Date().toLocaleTimeString().
		replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
	},
	getRandomItem: function(arr) {
	    return arr[Math.floor(Math.random()*arr.length)];
	}

    };

  chat.init();

  var searchFilter = {
    options: { valueNames: ['name'] },
    init: function() {
      var userList = new List('people-list', this.options);
      var noItems = $('<li id="no-items-found">No items found</li>');

      userList.on('updated', function(list) {
        if (list.matchingItems.length === 0) {
          $(list.list).append(noItems);
        } else {
          noItems.detach();
        }
      });
    }
  };

  searchFilter.init();

})();
