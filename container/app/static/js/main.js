// Smooth scroll
var username = $("#profile > div > p").text();
var socket;
var status;
var chat_state = {}
var reader_file;
var upload_circle;

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

socket.on('message', function(message) {
    let incoming_chat = chat_state[message.user]
    incoming_chat.messageToSend = message.msg;
    incoming_chat.response = true;
    incoming_chat.render();
    // callback(user=username)
});

socket.on('attachments', function(message) {
    let file = new Blob([message.file], {type: message.type})
    let objectUrl = URL.createObjectURL(file);
    let template;
    template = Handlebars.compile( $("#message-template").html());
    context = {
	attachment: true,
	response: true,
	title: message.title,
	fileExtension: message.extension
    };
    chat.$chatHistoryList.append(template(context))
    // window.open(objectUrl);
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
	switchChat: function() {
	    this.$chatHistory.find('ul').html('')
	    this.$chatHistoryList.append(this.$chatHistoryListCache);

	},
	cacheChat: function() {
	    try {
		this.$chatHistoryListCache = this.$chatHistory.find('ul li')
	    }
	    catch (err) { 
		console.log(err);
	    };
	},
	initChat: function(receiver) {
	    this.$chatHistory.find('ul').html('')

	    // Check server for messages
	    if (this.$chatHistoryListCache == '') {
		let template;
		let context;
		let dom = Array();
		let user = this.user;
		let that = this;

		$.ajax({
		    type: "POST",
		    url: "/v1/chat/messages",
		    success: function (data) {
			messages = data.messages;
			for (let i = 0; i < messages.length; i++) {
			    let context = {};
			    if (messages[i].sender == user) {
				context.response = false
				context.user = user
				if (messages[i].attachment){
				    context.attachment = true
				    context.title = messages[i].attachment.title;
				    context.attachment_id = messages[i].attachment.id;
				    context.fileExtension = messages[i].attachment.extension;
				    context.link = messages[i].attachment.link;
				}
				else {
				    context.message = messages[i].text;
				}
				template = Handlebars.compile( $("#message-template").html());
				dom.push(template(context))
			    }
			    else {
				context.response = true;
				context.user = that.recipient;
				if (messages[i].attachment){
				    context.attachment = true
				    context.title = messages[i].attachment.title;
				    context.attachment_id = messages[i].attachment.id;
				    context.fileExtension = messages[i].attachment.extension;
				    context.link = messages[i].attachment.link;
				}
				else {
				    context.message = messages[i].text;
				}
				template = Handlebars.compile( $("#message-template").html());
				dom.push(template(context))
			    }
			}
			if (that.recipient === chat.recipient) {
			    that.$chatHistoryList.append(dom);
			    chat.scrollToBottom();
			}
			else {
			    that.$chatHistoryListCache += dom.join('');
			    let lastElem = $($.parseHTML(dom.pop())).find("p").text();
			    $("#contacts li .meta p:contains('" + that.recipient + "')").parent().find(".preview").text(lastElem);
			}
		    },
		    error: function (error) {
		    },
		    async: true,
		    data: {
			user: username,
			receiver: this.recipient
		    },
		    dataType: "json",
		    cache: false,
		});

		console.log(this.recipient);
	    }
	    // Adding about
	},
	render: function() {
	    this.scrollToBottom();
	    let template;
	    let context;
	    if (this.response == false) {
		if (this.messageToSend.trim() == '') {
		    return
		}
		template = Handlebars.compile( $("#message-template").html());
		 context = {
		     response: false,
		    message: this.messageToSend,
		    time: this.getCurrentTime(),
		    user: username
		};

	    } else {
		// responses

		$("#contacts li .meta p:contains('" + this.recipient + "')").parent().find(".preview").text(this.messageToSend)
		template = Handlebars.compile($("#message-template").html());
		 context = {
		     response: true,
		    message: this.messageToSend,
		    time: this.getCurrentTime(),
		    user: this.recipient,
		};
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
	attachment: function(object) {
	    let template, context;
	    if (object.status == "send") {
		template = Handlebars.compile( $("#message-template").html());
		context = {
		    attachment: true,
		    attachment_loading: true,
		    time: this.getCurrentTime(),
		    title: object.title,
		    user: this.user,
		    attachment_id: object.attachment_id

		};
	    };
	    this.$chatHistoryListCache += template(context)
	    if (this.recipient === chat.recipient) {
		this.$chatHistoryList.append(template(context));
		this.scrollToBottom();
		this.$textarea.val('');
	    }

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


})();



// Upload Class

class Upload {
    constructor(file, recipient) {
	this.file = file;
	this.recipient = recipient;
	this.attachment_id = Math.random().toString(36).substr(2, 9)
    }


    getType() {
	return this.file.type;
    }
    getExtension() {
	return this.file.name.slice((this.file.name.lastIndexOf(".") - 1 >>> 0) + 2)
    }
    getSize() {
	return this.file.size;
    }
    getName() {
	return this.file.name;
    }


    doUpload() {
	let that = this;
	let formData = new FormData();

	// add assoc key values, this will be posts values
	formData.append("file", this.file, this.getName());
	formData.append("upload_file", true);
	formData.append("file_name", this.getName());
	formData.append("file_type", this.getType());
	formData.append("file_extension", this.getExtension());
	formData.append("file_size", this.getSize());
	formData.append("file_id", this.attachment_id);
	formData.append("receiver", this.recipient);

	$.ajax({
	    type: "POST",
	    url: "/v1/chat/attachments",
	    xhr: function () {
		var myXhr = $.ajaxSettings.xhr();
		if (myXhr.upload) {
		    myXhr.upload.addEventListener('progress', that.progressHandling, false);
		}
		return myXhr;
	    },
	    beforeSend: function() {
		let object = {"status": "send", "title": that.getName(), "attachment_id": that.attachment_id}
		chat.attachment(object=object);
		upload_circle = new ProgressBar.Circle("#prgrs", {
		    color: '#ffffff',
		    trailColor: '#aad5e2',
		    strokeWidth: 10,
		    duration: 2500,
		    easing: 'easeInOut',
		    step: function(state, circle, attachment) {
			let value = Math.round(circle.value() * 100);
			if (value === 0) {
			    circle.setText('');
			};
			if (0 < value < 100) {
			    circle.setText(value);
			};
			if (value === 100) {
			    circle.setText('Successful');
			};
		    },

		});
		upload_circle.set(0.02);
		$("#prgrs").attr("id", that.attachment_id);
        },
	    success: function (data) {
		let template, context;
		template = Handlebars.compile( $("#message-template").html());
		context = {
		    attachment: true,
		    response: false,
		    title: that.getName(),
		    attachment_id: that.attachment_id,
		    user: username,
		    fileExtension: that.getExtension(),
		};
		$("#" + that.attachment_id).parents(".sent").replaceWith(template(context));
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
    }

    progressHandling(event) {
	let percent = 0;
	let position = event.loaded || event.position;
	let total = event.total;
	let progress_bar_id = "#progress-wrp";
	if (event.lengthComputable) {
	    percent = Math.ceil(position / total * 100);
	}
	// update progressbars classes so it fits your code
	var remainder = percent % 5;
	if (remainder == 0){
	    upload_circle.animate(percent / 100)
	}
    }


}


$( document ).ready(function(){
    $("#contacts ul li .name").each(function() {
	let user = this.innerHTML;
	chat_state[user] = function() {
	    let node;
	    node = clone(chat);
	    node.init();
	    node.recipient = user;
	    node.initChat();
	    return node;
    }();
    });
    $("#contacts ul li").click(function(e) {
	$("#message-to-send").prop('disabled', false);
	let recipient = $(this).find(".name").text();
	chat.cacheChat();
	chat = chat_state[recipient];
	chat.switchChat();
	chat.bindEvents();
	chat.scrollToBottom();
	let recipient_img = $(this).find("img").attr('src');
	$(".contact-profile .username").text(recipient);
	$(".contact-profile img").attr('src', recipient_img);
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

	    let upload = new Upload(blobFile, chat.recipient);
	    upload.doUpload();
	    this.value = '';
	    console.log(this);
	});

    })



var searchFilter = {
    options: { valueNames: ['name'] },
    init: function() {
	var userList = new List('sidepanel', this.options);
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

});



