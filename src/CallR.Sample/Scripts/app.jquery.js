/// <reference path="jquery-1.10.2.js" />
/// <reference path="callr-1.0.0.js" />
$(function () {
    var hub = hubModule.init("API");
    hub.addRPC("getTest", "GetTest")
       .addRPC("send", "Send", "channel", "name", "message")
       .addRPC("sendTest", "SendTest")
       .addRPC("subscribe", "Subscribe", "channel")
       .addRPC("unsubscribe", "Unsubscribe", "channel");

    var messages = [],
        channels = [],
        selectedChannel = null;
        
    function addMessageToDOM(message) {
        $('#messages').append('<li>' +
            '<span class="chat-from">' +
                message.name +
            '</span>' +
            '<span class="chat-msg">' +
                message.message +
            '</span></li>');
    }

    function addMessage(message) {
        messages.push(message);
        if (message.channel === selectedChannel) {
            addMessageToDOM(message);
        }
    }

    function addChannelToDOM(channel) {
        $("#channels").append(
            '<li class="channel-cell" id="channel-' + channel + '">' +
                '<span class="channel">' + channel + '</span>' +
                '<button id="channel-button-' + channel + '" class="leave-channel">x</button>' +
            '</li>');
    }

    function joinChannel(channel) {
        if (!channel) {
            return;
        }

        // Remove selected channel state
        channels.push(channel);
        addChannelToDOM(channel);

        var chan = $('#channel-' + channel);
        var _chan = chan.find(".channel");

        _chan.click(function () {
            clearChannelSelection();
            _chan.addClass("select-channel");
            filterMessagesToChannel(channel);
            selectedChannel = channel;
        });

        var btn = $('#channel-button-' + channel);
        btn.click(function () {
            hub.rpc.unsubscribe(channel);
            chan.remove();
            if (selectedChannel === channel) {
                selectedChannel = null;
                clearMessages();
            }
        });

        selectedChannel = channel;
        clearChannelSelection();
        chan.find(".channel").addClass("select-channel");
        filterMessagesToChannel(channel);

    }

    function clearChannelSelection() {
        $(".select-channel").removeClass("select-channel");
    }

    function clearMessages() {
        $("#messages").find("li").remove();
    }

    function filterMessagesToChannel(channel) {
        clearMessages();
        $.each(messages, function (index, message) {
            if (message.channel === channel) {
                addMessageToDOM(message);
            }
        });
    }

    var handleError = function (error) {
        console.log(error);
    };

    hub.bindEvent("message", addMessage);

    hub.connection.logging = true;
    hub.connection.log("Connecting to server...");

    hub.connect().done(function () {
        console.log("Connected to server");
        var myName = "";

        $("#flush").unbind('click').click(function () {
            hub.flushRequests(function () {
                console.log("queue flushed");
            });
        });

        $("#get").unbind('click').click(function () {
            hub.rpc.getTest().done(function (message) {
                addMessage(message);
            }).fail(handleError);

        });

        $("#queueGet").unbind('click').click(function () {
            hub.queue.rpc.getTest()
                .done(addMessage)
                .fail(handleError);
        });

        // ------------------------------

        $("#send").unbind('click').click(function () {
            hub.rpc.sendTest();
        });

        $("#queueSend").unbind('click').click(function () {
            hub.queue.rpc.sendTest()
                .fail(handleError);
        });

        // ------------------------------

        function sendMsg(channel, name, message) {
            hub.rpc.send(channel, name, message);
        }

        $("#name").unbind('keyup').keyup(function () {
            var name = $('#name').val();
            var oldName = myName;
            myName = name;

            if (oldName.length === 0 && myName.length > 0) {
                // Make it visible
                $(".chat-container").removeClass("hidden");
            }
            else if (oldName.length > 0 && myName.length === 0) {
                // Make it invisible
                $(".chat-container").addClass("hidden");
            }
        });

        var msg = $("#msg");
        msg.unbind('keypress').keypress(function (e) {
            if (e.which === 13) {
                var message = msg.val();
                sendMsg(selectedChannel, myName, message);
                msg.val('');
            }
        });

        $("#channel").unbind('keypress').keypress(function (e) {
            if (e.which === 13) {
                var channel = $('#channel').val();

                hub.rpc.subscribe(channel).done(function () {
                    joinChannel(channel);
                });

                $('#channel').val('');
            }
        });

        $("#disconnect").unbind('click').click(function () {
            console.log("Disconnecting from server...");
            hub.disconnect();
            console.log("Connection state is: " + hub.connection.state);
        });

        
        hub.rpc.subscribe("TestChannel").done(function () {
            joinChannel("TestChannel");
        });
    });

    $("#connect").click(function () {
        hub.connect();
    });
});