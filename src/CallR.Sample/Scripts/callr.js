/*!
* callr JavaScript Library v1.1.4
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
;(function() {
    "use strict";
    var resources = {
        nojQuery: "jQuery was not found. Please ensure jQuery is referenced before the CallR client JavaScript file.",
        noSignalR: "SignalR was not found. Please ensure SignalR is referenced before the CallR client JavaScript file."
    };

    var $ = window.jQuery;

    var urlOverride;
    var connectOptions;

    if (typeof ($) !== "function") {
        // no jQuery!
        throw new Error(resources.nojQuery);
    }

    if (typeof ($.signalR) !== "function") {
        // no SignalR!
        throw new Error(resources.noSignalR);
    }

    var configure = function (conf) {
        if (typeof (conf) !== "undefined") {
            if (typeof (conf.url) === "string") {
                $.connection.hub.url = urlOverride = conf.url;
            }
            if (typeof (conf.connectOptions) === "object") {
                connectOptions = conf.connectOptions;
            }
        }
    };

    // State of requests in flight
    var outstandingRequests = {};
    var requestsInFlight = 0;
    var requestId = 0;

    // Initialize a new hub by name
    var init = function (hubName) {

        var conn = $.connection.hub,
            hub = $.connection[hubName];

        if (typeof (conn.state) === "undefined") {
            conn = $.hubConnection(urlOverride);
            $.connection.hub = conn;
        }

        if (typeof (hub) === "undefined") {
            hub = conn.createHubProxy(hubName);
            $.connection[hubName] = hub;
        }

        if (hub.callR) {
            // Already initialized
            return hub;
        }

        hub.callR = true;

        hub.bindEvent = hub.on;
        hub.unbindEvent = hub.off;

        // Bind to the connected event to ensure that
        // OnConnected is called on the server. If no
        // events are bound, OnConnected is not called
        // which is problematic for setting up groups.
        function connected() {
            // Do nothing
        }

        hub.bindEvent("connected", connected);

        // The context of conn.start must be the conn
        // We're using a function wrapper here instead
        // of .bind for better browser support.
        hub.connect = function (options, callback) {
            options = $.extend({}, connectOptions, options);
            return conn.start(
                options,
                callback);
        };

        // The context of conn.stop must be the conn
        // We're using a function wrapper here instead
        // of .bind for better browser support.
        hub.disconnect = function (async, notifyServer) {
            return conn.stop(async, notifyServer);
        };

        var _requestQueue = [];
        function queueRequest (request) {
            var deferred = $.Deferred();

            _requestQueue.push([request, deferred]);

            return deferred.promise();
        }

        var closeAfter = false;

        hub.smartDisconnect = false;

        hub.flushRequests = function (cb) {
            // Swap out the request queue
            var rq = _requestQueue;
            _requestQueue = [];

            var requestsRemaining = rq.length;

            if (requestsRemaining === 0) {
                hub.connection.log("No requests to flush");
                if (typeof (cb) === "function") {
                    cb();
                }
                return;
            }

            hub.connection.log("Flushing request queue");

            if (hub.smartDisconnect
                && (closeAfter
                   || conn.state === $.signalR.connectionState.disconnected)) {
                hub.connection.log("smartDisconnect is enabled and the"
                    + " connection was disconnected before this request."
                    + " The connection will be closed after.");
                closeAfter = true;
            }

            var requestComplete = function (id) {
                if (id in outstandingRequests) {
                    delete outstandingRequests[id];
                    requestsInFlight -= 1;
                }


                requestsRemaining--;
                if (requestsRemaining === 0) {

                    hub.connection.log("Finished flushing request queue");
                    if (closeAfter && 0 === requestsInFlight) {
                        // Reset closeAfter
                        closeAfter = false;
                        hub.connection.log("Closing connection");
                        hub.disconnect();
                    }

                    if (typeof (cb) === "function") {
                        cb();
                    }
                }
            };

            function _queueRequest(request, deferred) {
                var requestPromise = request();

                // Add requests to the outstanding requests
                var id = requestId.toString();
                requestId += 1;
                requestsInFlight += 1;
                outstandingRequests[id] = {
                    request: request,
                    promise: requestPromise,
                    deferred: deferred
                };

                requestPromise.done(function (response) {
                    if (deferred) {
                        deferred.resolve(response);
                    }
                }).fail(function (error) {
                    if (deferred) {
                        deferred.reject(error);
                    }
                }).always(function () {
                    requestComplete(id);
                });
            }

            hub.connect().then(function () {
                var len = rq.length;
                for (var i = 0; i < len; i++) {
                    _queueRequest(rq[i][0], rq[i][1]);
                }

                _requestQueue = [];
            });
        };

        function _request (promise) {
            hub.flushRequests();
            return promise;
        }

        function _rpc(args) {
            if (!args.name) {
                throw new Error("No function name provided.");
            }

            var name = args.name;
            var params = args.params;

            if (typeof(args.params) === 'undefined') {
                params = [];
            }

            if (!$.isArray(params)) {
                params = [params];
            }

            var invokeArgs = $.merge([name], params);

            var callrParams = {};
            var hasParams = false;

            for (var property in args) {
                if (args.hasOwnProperty(property) &&
                    property !== 'name' &&
                    property !== 'params') {
                    callrParams[property] = args[property];
                    hasParams = true;
                }
            }

            if (hasParams) {
                invokeArgs.push(callrParams);
            }

            return hub.invoke.apply(hub, invokeArgs);
        }

        hub._myRPC = makeRPCFunction(_rpc);

        hub._myQueueRPC = makeRPCFunction(_rpc, true);

        hub.rpc = function (args) {
            return hub._myRPC(args);
        };

        hub.queue = {
            rpc: function (args) {
                return hub._myQueueRPC(args);
            }
        };

        function makeRPCFunction(fn, queue) {
            return function () {
                var args = [].slice.call(arguments);
                var request = function () {
                    return fn.apply(this, args);
                };

                var promise = queueRequest(request);

                if (queue) {
                    return promise;
                }

                return _request(promise);
            };
        }

        function _addRPC (name, fn) {
            hub.rpc[name] = makeRPCFunction(fn);
            hub.queue.rpc[name] = makeRPCFunction(fn, true);
        }

        hub.addRPC = function (name) {
            if (typeof (name) === "undefined") {
                throw new Error("addRPC requires a name");
            }

            function rpcCall() {
                var args = [].slice.call(arguments);
                return hub.invoke.apply(hub, $.merge([name], args));
            }

            _addRPC(name, rpcCall);

            return this;
        };

        for (var key in hub.server) {
            if (hub.server.hasOwnProperty(key)) {
                _addRPC(key, hub.server[key]);
            }
        }

        return hub;
    };

    $.callR = {
        "configure": configure,
        "init": init,
        "version": "1.1.4"
    };

    window.hubModule = $.callR;
})();