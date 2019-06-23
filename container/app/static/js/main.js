// Smooth scroll
var username = $("#profile > div > p").text();
var socket;
var status;
var chat_state = {}
var reader_file;

// Socket Connection
$( document ).ready(function(){
namespace = "/api/chat";
socket = io.connect(
  location.protocol + "//" + document.domain + ":" + location.port + namespace
);
  // Cleanup
socket.emit("join")

window.onbeforeunload = function() {
    socket.emit("leave")
    socket.disconnect()
};

socket.on('message', function(message, callback) {
    let incoming_chat = chat_state[message.user]
    incoming_chat.messageToSend = message.msg;
    incoming_chat.response = true;
    incoming_chat.render();
    callback(user=username)
});

socket.on('attachments', function(message) {
    let file = new Blob([message.file], {type: message.type})
    let objectUrl = URL.createObjectURL(file);
    window.open(objectUrl);
});


socket.on('status', function(message) {

    if (message.status == "message_received") {
	console.log("Message received")
    }
    if (message.status == "typing" && message.user == chat.recipient) {
	if (status == "typing") {
	    return
	}
	chat.scrollToBottom()
	status = "typing";
	let template = `
		    <div class="typing_on">
				<i class="fa fa-circle typing_circle one"></i>
				<i class="fa fa-circle typing_circle two"></i>
				<i class="fa fa-circle typing_circle three"></i>
				<i class="fa fa-circle typing_circle four"></i>
		    </div>
		    `;

	$(".contact-profile p").after(template);
    }
    if (message.status == "not_typing" && message.user == chat.recipient) {
	status = "";
	$(".contact-profile").find(".typing_on").remove();
    }

    if (message.status == "user_online") {
	console.log("User online");
	$("#contacts li .meta p:contains('" + message.user + "')").parent().parent().find(".contact-status").attr('class', 'contact-status online');
    }
    if (message.status == "user_offline") {
	console.log("User online")
	$("#contacts li .meta p:contains('" + message.user + "')").parent().parent().find(".contact-status").attr('class', 'contact-status offline');
    }
});


socket.on("connection_response", function(msg) {
  console.log(msg.running_process);
});
});



(function(){
    chat = {
	messageToSend: '',
	user: username,
	recipient: null,
	response: false,
	typing: false,
	active: false,
	timeout: undefined,
	messages_count: null,
	$chatHistoryListCache: '',

	init: function() {
	    this.setupDOM();
	    this.render();
	    this.bindEvents();
	    // this.initChat();
	},
	setupDOM: function() {
	    this.$chatHistory = $('.content .messages');
	    this.$button = $('.message-input button');
	    this.$textarea = $('#message-to-send');
	    this.$chatHistoryList =  this.$chatHistory.find('ul');
	},
	bindEvents: function() {
	    this.$button.off();
	    this.$textarea.off();
	    this.$button.on('click', this.addMessage.bind(this));
	    this.$textarea.on('keyup', this.keyPressed.bind(this));
	},
	initChat: function() {
	    this.$chatHistory.find('ul').html('')

	    // Check server for messages
	    if (this.$chatHistoryListCache == '') {
		let template;
		let context;
		let dom = Array();
		let user = this.user;
		let chat_history = this.$chatHistoryList;

		$.ajax({
		    type: "POST",
		    url: "/v1/chat/messages",
		    success: function (data) {
			messages = data.messages;
			for (let i = 0; i < messages.length; i++) {
			    if (messages[i].sender == user) {
				template = Handlebars.compile( $("#message-template").html());
				context = {
				    response: messages[i].text,
				};
				dom.push(template(context))
			    }
			    else {
				template = Handlebars.compile( $("#message-response-template").html());
				context = {
				    response: messages[i].text,
				};
				dom.push(template(context))
			    }
			}
			chat_history.append(dom);
			chat.scrollToBottom();
		    },
		    error: function (error) {
		    },
		    async: true,
		    data: {
			user: username,
			receiver:this.recipient
		    },
		    dataType: "json",
		    cache: false,
		});

	    }
	    else {
		this.$chatHistoryList.append(this.$chatHistoryListCache);
		$("#contacts li .meta p:contains('" + this.recipient + "')").parent().find(".preview").text(chat.$chatHistoryList.find("li").last().find("p").text());
	    }

	    // Setting messages count


	    // Adding about
	},
	render: function() {
	    this.scrollToBottom();
	    let template;
	    if (this.response == false) {
		if (this.messageToSend.trim() == '') {
		    return
		}
		template = Handlebars.compile( $("#message-template").html());

	    } else {
		// responses

		$("#contacts li .meta p:contains('" + this.recipient + "')").parent().find(".preview").text(this.messageToSend)
		template = Handlebars.compile($("#message-response-template").html());
	    };

	    let context = {
		response: this.messageToSend,
		time: this.getCurrentTime(),
		user: username
	    };
	    this.messages_count++;

	    this.$chatHistoryListCache += template(context)
	    this.messages += 1;

	    if (this.recipient === chat.recipient) {
		this.$chatHistoryList.append(template(context));
		this.scrollToBottom();
		this.$textarea.val('');
	    }
	},

	addMessage: function() {
	    this.response = false
	    this.messageToSend = this.$textarea.val()
	    this.render()
	    socket.emit('text', {msg:this.messageToSend, recipient:this.recipient})
	},
	keyPressed: function(event) {
	    // enter was pressed
	    let val_length = $('#message-to-send').val().length;
	    if (event.keyCode === 13) {
		this.addMessage();
		socket.emit('typing', {recipient: this.recipient, status: '0'});
	    }
	    else {
	    if (val_length > 0){
		socket.emit('typing', {recipient: this.recipient, status: '1'});
	    }
	    if (val_length == 0){
		socket.emit('typing', {recipient: this.recipient, status: '0'});
	    }
	    }
	},
	scrollToBottom: function() {
	    this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
	},
	getCurrentTime: function() {
	    return new Date().toLocaleTimeString().
		replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
	},
    };

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

// Upload functions
var Upload = function (file, recipient) {
    this.file = file;
    this.recipient = recipient;
};

Upload.prototype.getType = function() {
    return this.file.type;
};
Upload.prototype.getSize = function() {
    return this.file.size;
};
Upload.prototype.getName = function() {
    return this.file.name;
};
Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("file", this.file, this.getName());
    formData.append("upload_file", true);
    formData.append("file_name", this.getName());
    formData.append("file_type", this.getType());
    formData.append("file_size", this.getSize());
    formData.append("recipient", this.recipient);

    $.ajax({
        type: "POST",
	url: "/upload",
        xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', that.progressHandling, false);
            }
            return myXhr;
        },
        success: function (data) {
            // your callback here
        },
        error: function (error) {
            // handle error
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
};

Upload.prototype.progressHandling = function (event) {
    var percent = 0;
    var position = event.loaded || event.position;
    var total = event.total;
    var progress_bar_id = "#progress-wrp";
    if (event.lengthComputable) {
        percent = Math.ceil(position / total * 100);
    }
    // update progressbars classes so it fits your code
    $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
    $(progress_bar_id + " .status").text(percent + "%");
};

/// End upload functions



$( document ).ready(function(){
    $("#contacts ul li .name").each(function() {
	let user = this.innerHTML;
	chat_state[user] = function() {
	    let node;
	    node = clone(chat);
	    node.init();
	    node.recipient = user;
	    return node;
    }();
    });
    $("#contacts ul li").click(function(e) {
	$("#message-to-send").prop('disabled', false);
	recipient = $(this).find(".name").text();
	chat = chat_state[recipient];
	chat.initChat();
	chat.bindEvents();
	$(".contact-profile .username").text(recipient);
    })


    function getBase64(file) {	var reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = function () {
	    return reader.result;
	};
	reader.onerror = function (error) {
	    console.log('Error: ', error);
	};
    }


    // Attachment input
    $(".message-input .attachment").click(function() {
	$(".message-input #file_attachment").click();
	$(".message-input #file_attachment").on('change', function() {
	    let blobFile = this.files[0];

	    //// SocketIO method
	    // let reader = new FileReader();
	    // reader.onload = function(e){
		// console.log(e.target.result)
		// socket.emit("upload", {file: e.target.result })
	    // };
	    // reader.readAsBinaryString(blobFile);


	    //// Http method
	    let upload = new Upload(blobFile, chat.recipient);
	    upload.doUpload();
	});

    })

});



