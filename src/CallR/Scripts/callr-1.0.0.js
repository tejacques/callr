/*!
* callr JavaScript Library v1.0.0
* https://github.com/tejacques/callr
*
* Distributed in whole under the terms of the MIT License (MIT)
*
* Copyright 2014, Tom Jacques
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Create hubModule to set up and utilize SignalR hubs
var hubModule = (function () {
    "use strict";

    // Initialize a new hub by name
    var init = function (hubName) {

        var hub = $.connection[hubName];
        hub.subscriptions = {};
        
        hub.bindEvent = hub.on;

        hub.unbindEvent = hub.off;

        hub.connect = function (options, callback) {
            return $.connection.hub.start(options, callback);
        };

        hub.disconnect = function (async, notifyServer) {
            return $.connection.hub.stop(async, notifyServer);
        };

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
            }

            hub.connect().done(function () {
                var len = _requestQueue.length;
                for (var i = 0; i < len; i++) {
                    _queueRequest(_requestQueue[i][0], _requestQueue[i][1]);
                }

                _requestQueue = [];
            });
        };

        hub.request = function (promise) {
            hub.flushRequests();
            return promise;
        };

        hub.api = hub.api || {};
        hub.queueApi = hub.queueApi || {};

        function makeApiFunction(name) {
            return function () {
                var args = [].slice.call(arguments);
                var promise = hub.server[name].apply(this, args);
                return hub.request(promise);
            };
        }

        function makeQueueApiFunction(name) {
            return function () {
                var args = [].slice.call(arguments);
                var request = function () {
                    return hub.server[name].apply(this, args);
                };

                return hub.queueRequest(request);
            };
        }

        hub.addAPICall = function (name) {
            if (hub.server[name]) {
                hub.api[name] = makeApiFunction(name);
                hub.queueApi[name] = makeQueueApiFunction(name);
            }
        };

        for (var key in hub.server) {
            if (hub.server.hasOwnProperty(key)) {
                hub.addAPICall(key);
            }
        }

        return hub;
    };
    return {
        init: init
    };
})();
