/// <reference path="jquery-1.10.2.js" />
/// <reference path="callr-1.0.0.js" />
/// <reference path="angular.js" />
var chatApp = angular.module('chatApp', ['hubModule']);

chatApp.config(function (hubFactoryProvider) {
    hubFactoryProvider.configure({
        url: "/signalr-endpoint2",
        connectOptions: {
            waitForPageLoad : false
        }
    });
});
chatApp.controller('ChatController', ['$scope', 'hubFactory', '$q',
    function ($scope, hubFactory, $q) {
        $scope.messages = [];
        $scope.channels = [];

        $scope.name = null;
        $scope.message = null;
        $scope.channel = null;

        $scope.display = { "channel": "TestChannel" };

        var hub = hubFactory.create("API");

        // Explicitely set server functions
        hub.addRPC("getTest")
           .addRPC("send")
           .addRPC("sendTest")
           .addRPC("subscribe")
           .addRPC("unsubscribe");

        hub.connection.logging = true;
        hub.connect();

        $scope.sendMessage = function (channel, name, message) {
            if (channel && name && message) {
                hub.rpc.send(channel, name, message);
            }

            $scope.message = null;
        };

        $scope.addMessage = function (message) {
            console.log("Adding message: ", message);
            $scope.messages.push(message);
        };

        $scope.sendTestMessage = function () {
            hub.rpc.sendTest();
        };

        $scope.queueSendTestMessage = function () {
            hub.queue.rpc.sendTest();
        };

        $scope.getTestMessage = function () {
            hub.rpc.getTest().then($scope.addMessage, function (error) {
                console.log(error);
            });
        };

        $scope.queueGetTestMessage = function () {
            hub.queue.rpc.getTest().then($scope.addMessage);
        };

        $scope.flushRequests = hub.flushRequests;

        $scope.joinChannel = function (channel) {
            if (!channel) {
                return;
            }

            hub.rpc.subscribe(channel);
            $scope.channel = null;
        };

        hub.on('joinChannel', function (channel) {
            if ($scope.channels.indexOf(channel) === -1) {
                $scope.channels.push(channel);
            }
            $scope.setChannel(channel);
            $scope.$apply();
        });

        $scope.setChannel = function (channel) {
            $scope.display.channel = channel;
        };

        $scope.leaveChannel = function (channel) {
            if (!channel) {
                return;
            }
            hub.rpc.unsubscribe(channel);
        };

        hub.on('leaveChannel', function (channel) {
            $scope.channels.splice($scope.channels.indexOf(channel), 1);
            if ($scope.display.channel === channel) {
                $scope.display.channel = null;
            }
            $scope.$apply();
        });

        var conn = $.connection.hub;
        var connect = hub.connect;
        $scope.connect = hub.connect = function (options, callback) {
            var state = conn.state;
            var deferred = $q.defer();
            var promise = deferred.promise;
            var connectPromise = connect(options, callback);
            console.log("state: ", state);
            if (state === $.signalR.connectionState.disconnected) {
                connectPromise.then(function (value) {
                    var promises = []

                    if ($scope.channels.length > 0) {
                        angular.forEach($scope.channels, function (channel) {
                            promises.push(hub.rpc.subscribe(channel));
                        });

                        $q.all(promises).finally(function () {
                            deferred.resolve(value);
                        });

                    } else {
                        deferred.resolve(value);
                    }
                });
            } else {
                return connectPromise;
            }
            return promise;
        }
        $scope.disconnect = hub.disconnect;

        hub.bindEvent("message", $scope.addMessage, $scope);

        $scope.connect().then(function() {
            $scope.joinChannel("TestChannel");
        });
    }
]);