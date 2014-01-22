/// <reference path="jquery-1.10.2.js" />
/// <reference path="callr-1.0.0.js" />
/// <reference path="angular.js" />
var chatApp = angular.module('chatApp', []);
chatApp.value('$', $);
hubModuleFactory(chatApp);

chatApp.controller('ChatController', ['$', '$scope', 'signalr',
    function ($, $scope, signalr) {
        $scope.messages = [];
        $scope.channels = [];

        $scope.name = null;
        $scope.message = null;
        $scope.channel = null;

        $scope.displayChannel = null;

        var hub = signalr.init("API");
        hub.connection.logging = true;

        $scope.sendMessage = function (channel, name, message) {
            if (channel && name && message) {
                hub.api.send(channel, name, message);
            }

            $scope.message = null;
        };

        $scope.addMessage = function (message) {
            $scope.messages.push(message);
        };

        $scope.sendTestMessage = function () {
            hub.api.sendTest();
        };

        $scope.queueSendTestMessage = function () {
            hub.queueApi.sendTest();
        };

        $scope.getTestMessage = function () {
            hub.api.getTest().then($scope.addMessage);
        };

        $scope.queueGetTestMessage = function () {
            hub.queueApi.getTest().then($scope.addMessage);
        };

        $scope.flushRequests = hub.flushRequests;

        $scope.joinChannel = function (channel) {
            if (!channel) {
                return;
            }

            hub.api.subscribe(channel).then((function (channel) {
                return function () {
                    $scope.channels.push(channel);
                    $scope.displayChannel = channel;
                };
            })(channel));

            $scope.channel = null;
        };

        $scope.setChannel = function (channel) {
            $scope.displayChannel = channel;
        };

        $scope.leaveChannel = function (channel) {
            hub.api.unsubscribe(channel).then(function () {
                $scope.channels.splice($scope.channels.indexOf(channel), 1);
            });
        };

        $scope.connect = hub.connect;
        $scope.disconnect = hub.disconnect;

        hub.bindEvent("message", $scope.addMessage);

        $scope.connect().then(function() {
            $scope.joinChannel("TestChannel");
        });
    }
]);