/// <reference path="jquery-1.10.2.js" />
/// <reference path="callr-1.0.0.js" />
$(function () {
    var hub = hubModule.init("API");

    var displayMessage = function (message) {
        $('#messages').append('<li><span class="chat-header"><span class="chat-channel">' +
                message.channel +
            '</span>' +
            '<span class="chat-from">' +
                message.name +
            '</span></span>' +
            '<span class="chat-msg">' +
                message.message +
            '</span></li>');
    };

    var handleError = function (error) {
        console.log('Error: ' + error);
    };

    hub.bindEvent("message", displayMessage);

    hub.connection.logging = true;
    hub.connection.log("Connecting to server...");

    hub.connect().done(function () {
        console.log("Connected to server");

        $("#flush").unbind('click').click(function () {
            hub.flushRequests(function () {
                console.log("queue flushed");
            });
        });

        $("#get").unbind('click').click(function () {
            hub.api.getTest().done(function (message) {
                displayMessage(message);
            }).fail(handleError);

        });

        $("#queueGet").unbind('click').click(function () {
            hub.queueApi.getTest()
                .done(displayMessage)
                .fail(handleError);
        });

        // ------------------------------

        $("#send").unbind('click').click(function () {
            hub.api.sendTest();
        });

        $("#queueSend").unbind('click').click(function () {
            hub.queueApi.sendTest()
                .fail(handleError);
        });

        // ------------------------------

        function sendMsg() {
            var channel = $('#channel').val(),
                name = $('#name').val(),
                msg = $('#msg');
                message = msg.val();

            hub.api.send(channel, name, message);

            msg.val('');
        }

        $("#publish").unbind('click').click(sendMsg);

        $("#msg").unbind('keypress').keypress(function (e) {
            if (e.which === 13) {
                console.log(e);
                sendMsg();
            }
        });

        $("#subscribe").unbind('click').click(function () {
            var channel = $('#channel').val();

            hub.api.subscribe(channel).done(function () {
                console.log("Subscribed to channel " + channel);
            });
        });

        $("#unsubscribe").unbind('click').click(function () {
            var channel = $('#channel').val();

            hub.api.unsubscribe(channel).done(function () {
                console.log("Unsubscribed from channel " + channel);
            });
        });

        $("#disconnect").unbind('click').click(function () {
            console.log("Disconnecting from server...");
            hub.disconnect();
            console.log("Connection state is: " + hub.connection.state);
        });
    });

    $("#connect").click(function () {
        hub.connect();
    });
});