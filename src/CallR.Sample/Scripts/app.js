/// <reference path="jquery-1.10.2.js" />
/// <reference path="callr-1.0.0.js" />
/// <reference path="angular.js" />
var chatApp = angular.module('chatApp', []);
chatApp.value('$', $);

chatApp.factory('signalr', ['$', '$q',
    function ($, $q) {
        if ($.connection.API && $.connection.API.api) {
            return $.connection.API;
        }
        var signalr = hubModule.init("API");

        function autoApply(api) {
            $.each(signalr[api], function (el) {
                var fn = signalr[api][el];
                signalr[api][el] = function () {
                    var args = [].slice.call(arguments);
                    var promise = fn.apply(null, args);
                    var qpromise = $q.when(promise);

                    qpromise.done = function (cb) {
                        return this.then(cb);
                    };

                    qpromise.fail = function (cb) {
                        return this.then(null, cb);
                    };

                    return qpromise;
                };
            });
        }

        autoApply("api");
        autoApply("queueApi");

        return signalr;
    }
]);

chatApp.controller('ChatController', ['$', '$scope', 'signalr',
    function ($, $scope, signalr) {
        $scope.messages = [];
        $scope.channels = [];

        $scope.name = null;
        $scope.message = null;
        $scope.channel = null;

        $scope.displayChannel = null;

        signalr.connection.logging = true;

        $scope.sendMessage = function (channel, name, message) {
            console.log("Sending Message");
            if (channel && name && message) {
                signalr.api.send(channel, name, message).done(function () {
                    //$scope.$apply();
                });
            }

            $scope.message = null;
        };

        $scope.addMessage = function (message) {
            console.log("Adding Message");
            $scope.messages.push(message);
            //$scope.$apply();
        };

        $scope.sendTestMessage = function () {
            signalr.api.sendTest();
        };

        $scope.queueSendTestMessage = function () {
            signalr.queueApi.sendTest();
        };

        $scope.getTestMessage = function () {
            signalr.api.getTest().done($scope.addMessage);
        };

        $scope.queueGetTestMessage = function () {
            signalr.queueApi.getTest().done($scope.addMessage);
        };

        $scope.flushRequests = signalr.flushRequests;

        $scope.joinChannel = function (channel) {
            console.log(channel);
            if (!channel) {
                return;
            }

            signalr.api.subscribe(channel).done((function(channel) {
                return function () {
                    console.log("Joined Channel");
                    $scope.channels.push(channel);
                    $scope.displayChannel = channel;
                    //$scope.$apply();
                };
            })(channel));

            $scope.channel = null;
        };

        $scope.setChannel = function (channel) {
            $scope.displayChannel = channel;
        };

        $scope.leaveChannel = function (channel) {
            signalr.api.unsubscribe(channel).done(function () {
                $scope.channels.splice($scope.channels.indexOf(channel), 1);
                //$scope.$apply();
            });
        };

        $scope.connect = signalr.connect;
        $scope.disconnect = signalr.disconnect;

        signalr.bindEvent("message", $scope.addMessage);
    }
]);