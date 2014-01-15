// Create hubModule to set up and utilize SignalR hubs
var hubModule = (function () {

    // Initialize a new hub by name
    var init = function (hubName) {

        var hub = $.connection[hubName];
        var api = hub.server;
        hub.subscriptions = {};

        hub.bindEvent = hub.on;

        hub.unbindEvent = hub.off;

        hub.connect = function (options, callback) {
            return $.connection.hub.start(options, callback);
        };

        hub.disconnect = function (async, notifyServer) {
            return $.connection.hub.stop(async, notifyServer);
        }

        var _requestQueue = [];
        hub.queueRequest = function (request) {
            var deferred = $.Deferred();

            _requestQueue.push([request, deferred]);

            return deferred.promise();
        };

        hub.flushRequests = function (cb) {
            var requestsRemaining = _requestQueue.length;

            if (requestsRemaining === 0) {
                hub.connection.log("No requests to flush");
                return;
            }

            hub.connection.log("Flushing request queue");

            var closeAfter = false;
            if ($.connection.hub.state === $.signalR.connectionState.disconnected) {
                closeAfter = true;
            }

            var requestComplete = function () {
                requestsRemaining--;
                if (requestsRemaining === 0) {
                    // All requests complete
                    hub.connection.log("Finished flushing request queue");
                    if (closeAfter) {
                        hub.stop();
                    }

                    if (cb) {
                        cb();
                    }
                }
            };

            function _queueRequest(request, deferred) {
                request().done(function (response) {
                    if (deferred) {
                        deferred.resolve(response);
                    }
                    requestComplete();
                }).fail(function (error) {
                    if (deferred) {
                        deferred.reject(error);
                    }
                    requestComplete();
                });
            };

            hub.connect().done(function () {
                var len = _requestQueue.length;
                for (var i = 0; i < len; i++) {
                    _queueRequest(_requestQueue[i][0], _requestQueue[i][1]);
                }

                _requestQueue = [];
            });
        }

        hub.request = function (promise) {
            hub.flushRequests();
            return promise;
        }

        for (var key in hub.server) {
            hub.api = hub.api || {};
            hub.queueApi = hub.queueApi || {};
            if (hub.server.hasOwnProperty(key)) {
                hub.api[key] = function (key) {
                    return function () {
                        var promise = hub.server[key].apply(this, arguments);
                        return hub.request(promise);
                    }
                }(key);

                hub.queueApi[key] = function (key) {
                    return function () {
                        var request = function () {
                            return hub.server[key].apply(this, arguments);
                        };

                        return hub.queueRequest(request);
                    }
                }(key);
            }
        }

        return hub;
    };
    return {
        init: init
    };
})();
