/*!
* callr JavaScript Library v1.1.2
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
/* exported hubModule */
var hubModule = (function () {
    "use strict";
    var resources = {
        nojQuery: "jQuery was not found. Please ensure jQuery is referenced before the CallR client JavaScript file.",
        noSignalR: "SignalR was not found. Please ensure SignalR is referenced before the CallR client JavaScript file."
    };

    var $ = window.jQuery;
    var signalR = $.signalR;
    var crosstab = window.crosstab; // NOTE: have things handle the use of this properly

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

    function getHub(hubName) {
        hubName = hubName.toLowerCase();
        var proxies = $.connection.hub.proxies;
        for (var hName in proxies) {
            if (proxies.hasOwnProperty(hName)) {
                var hub = proxies[hName];
                if (hub.hubName === hubName) {
                    return hub;
                }
            }
        }

        return null;
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
    // Initialize a new hub by name
    var init = function (hubName) {

        var conn = $.connection.hub,
            hub = $.connection[hubName];

        if (typeof (conn.state) === "undefined") {
            conn = $.hubConnection(urlOverride);
            
            $.connection.hub = conn;
        }

        if (typeof (hub) === "undefined") {
            hub = getHub(hubName) || conn.createHubProxy(hubName);
            $.connection[hubName] = hub;
        }

        if (hub.callR) {
            // Already initialized
            return hub;
        }

        hub.callR = true;
        if (!conn.callR) {
            conn.callR = {
                state: conn.state
            };
        }

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
            console.log("debug: options:", options, " callback: ", callback);

            var deferred = $.Deferred();
            var promise = deferred.promise();

            var resolve = function (res) {
                var conn = $.connection.hub;
                var state = conn.state;
                conn.callR.state = state;
                crosstab(function () {
                    if (crosstab.supported && isMaster()) {
                        var data = {
                            id: crosstb.util.generateId(),
                            state: state
                        }
                        crosstab.broadcast('callr.connection', data);
                    }
                })
                deferred.resolve(res);
            };

            var connect = function () {
                conn.start(options, callback).then(res, res);
            };

            if (crosstabAndNotMaster()) {
                // Utility
                deferred.resolve();

                if (typeof (callback) === 'function') {
                    callback();
                }
                console.log("returning resolvedPromise: ", promise);
                return promise;
            }

            return promise;
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

        var flushesInFlight = 0;
        var closeAfter = false;

        hub.smartDisconnect = false;

        hub.flushRequests = function (cb) {
            // Increment the flushes in flight
            flushesInFlight++;

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

            var requestComplete = function () {
                requestsRemaining--;
                if (requestsRemaining === 0) {
                    // All requests complete, decrement flushesInFlight
                    flushesInFlight--;

                    hub.connection.log("Finished flushing request queue");
                    if (closeAfter && 0 === flushesInFlight) {
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
                console.log("_queueRequest: request: ", request, " deferred: ", deferred);
                request().done(function (response) {
                    if (deferred) {
                        deferred.resolve(response);
                    }
                }).fail(function (error) {
                    if (deferred) {
                        deferred.reject(error);
                    }
                }).always(function () {
                    requestComplete();
                });
            }

            function makeRequests() {
                console.log("debug: makeRequests was called");
                var len = rq.length;
                for (var i = 0; i < len; i++) {
                    var request = rq[i][0];
                    var deferred = rq[i][1];
                    console.log("i is: ", i, " rq is:", rq);
                    console.log("call _queueRequest with: request: ", request);
                    _queueRequest(request, deferred);
                }
            }

            console.log("debug: calling connect().then(makeRequests);");
            console.log("makeRequests: ", makeRequests);
            hub.connect().then(makeRequests);
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

            if (!args.params) {
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

            return crosstabInvoke(hub, invokeArgs);
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

                console.log("queueing request: ", fn);
                var promise = queueRequest(request);

                if (queue) {
                    return promise;
                }

                console.log("flushing requests :", fn);
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
                return crosstabInvoke(hub, $.merge([name], args));
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
        "init": init
    };

    // Experimental crosstab support
    var errorCodes = {
        requestFailed: 0,
        notMaster: 1,
        timeout: 2,
        hubNotFound: 3
    };

    var errorMessages = {
        0: "Request failed",
        1: "The tab asked was not the master tab",
        2: "Request timeout",
        3: "Requested hub not found"
    };

    function errorResponse(message, errorCode) {
        return {
            id: message.data.id,
            ok: false,
            error: errorCode,
            errorMessage: errorMessages[errorCode]
        };
    }

    function successResponse(response, message, hub) {
        return {
            id: message.data.id,
            ok: true,
            response: response,
            state: hub.state,
            hubName: hub.hubName
        };
    }

    function masterTab() {
        return crosstab.util.tabs[crosstab.util.keys.MASTER_TAB];
    }

    function isMaster() {
        return crosstab.id === masterTab().id;
    }

    function crosstabAndNotMaster() {
        var result = crosstab
            && crosstab.supported
            && !isMaster();

        console.log("crosstabAndNotMaster() result: ", result);

        return result;
    }

    var crosstabRequests = {};
    var REQUEST_TIMEOUT = 1000 * 30; // 30 second timeout

    function crosstabInvoke(hub, invokeArgs) {
        console.log("==== CROSSTAB INVOKE REQUEST ====");
        crosstab(function () {
            if (crosstab.supported && !isMaster()) {
                console.log("==== CROSSTAB INVOKE REQUEST IS CROSSTABANDNOTMASTER ====");
                var deferred = $.Deferred();
                var id = crosstab.util.generateId();
                var data = {
                    id: id,
                    hubName: hub.hubName,
                    invokeArgs: invokeArgs
                };

                crosstabRequests[id] = {
                    deferred: deferred,
                    timestamp: crosstab.util.now()
                };

                // Make the request in another tab
                crosstab.broadcast('callr.request', data, masterTab().id);

                // Reject with a timeout errorCode if the promise doesn't resolve
                // within the REQUEST_TIMEOUT
                setTimeout(function () {
                    var response = errorResponse({
                        data: data
                    }, errorCodes.timeout);
                    deferred.reject(response);
                }, REQUEST_TIMEOUT);

                return deferred.promise();
            } else {
                return hub.invoke.apply(hub, invokeArgs);
            }
        });
    }

    crosstab(function () {
        if (crosstab.supported) {
            crosstab.util.events.on('callr.request', function (message) {
                // only handle direct messages
                if (!message.destination || message.destination !== crosstab.id) {
                    return;
                }

                console.log("callr.request message: ", message);

                var response;
                var connection;

                // only handle requests if we are the master
                if (crosstab.id !== masterTab().id) {
                    response = errorResponse(message, errorCodes.notMaster);
                    crosstab.broadcast('callr.response', response, message.origin);
                    return;
                }

                // Grab the correct hub
                var hub = init(message.data.hubName);
                var invokeArgs = message.data.invokeArgs;

                if (hub) {
                    // This is not designed to be compatible with smartDisconnect
                    // which is primarily meant to save battery on mobile.
                    // crosstab support is meant explicitely for desktops, so it
                    // does not even attempt to smartly disconnect.
                    connection = connection = $.connection.hub;
                    connection.start().then(function () {
                        hub.invoke.apply(hub, invokeArgs).done(function (res) {
                            // Request succeeded
                            response = successResponse(res, message, hub);
                            crosstab.broadcast(
                                'callr.response',
                                response,
                                message.origin);
                        }).fail(function () {
                            // Request failed
                            response = errorResponse(
                                message,
                                errorCodes.requestFailed);
                            crosstab.broadcast(
                                'callr.response',
                                response,
                                message.origin);
                        });
                    });
                } else {
                    // Request failed -- no hub
                    response = errorResponse(message, errorCodes.hubNotFound);
                    crosstab.broadcast('callr.response', response, message.origin);
                }
            });

            crosstab.util.events.on('callr.response', function (message) {
                // Always update the state
                var response = message.data;
                if (response && response.state && response.hubName) {
                    var hubName = response.hubName.toLowerCase();
                    var connection = $.connection.hub;
                    if (connection.proxies) {
                        // Trigger the local invocation event
                        var proxy = connection.proxies[hubName];

                        if (proxy) {
                            // Update the hub state
                            $.extend(proxy.state, response.state);
                        }
                    }
                }

                if (!message.destination || message.destination !== crosstab.id) {
                    return;
                }

                var id = message.data.id;
                var request = crosstabRequests[id];
                console.log("callr.response message: ", message);
                if (request) {
                    var deferred = request.deferred;
                    if (response.ok) {
                        deferred.resolve(response.response);
                    } else {
                        deferred.reject(response);
                    }
                    delete crosstabRequests[id];
                }
            });

            var eventNamespace = ".hubProxy";
            var makeEventName = function (event) {
                return event + eventNamespace;
            };

            var _hubConnection = $.hubConnection;
            var hubConnection = function (url, options) {
                var connection = _hubConnection(url, options);

                // Pulled straight from SignalR and modified
                connection.received(function (minData) {
                    if (!minData) {
                        return;
                    }

                    if ((typeof (minData.P) !== "undefined")
                        || (typeof (minData.I) !== "undefined")) {
                        return;
                    }

                    console.log("minData: ", minData);

                    var data = connection._maximizeClientHubInvocation(minData);

                    // We received a client invocation request,
                    // i.e. broadcast from server hub
                    connection.log("Broadcasting client hub event '"
                        + data.Method + "' on hub '" + data.Hub
                        + "' to other tabs.");

                    console.log("All data: ", data);

                    crosstab.broadcast('callr.broadcast', data);
                });

                return connection;
            };

            $.hubConnection = hubConnection;

            crosstab.util.events.on('callr.broadcast', function (message) {
                // We'll already process this normally on the master tab
                // so skip processing it here
                if (crosstab.id === masterTab().id) {
                    return;
                }

                var data = message.data;
                var connection = $.connection.hub;

                connection.log("Received broadcasted client hub event '"
                    + data.Method + "' on hub '" + data.Hub
                    + "'.");

                console.log("All data: ", data);

                // Normalize the names to lowercase
                var hubName = data.Hub.toLowerCase();
                var eventName = data.Method.toLowerCase();

                if (connection.proxies) {
                    // Trigger the local invocation event
                    var proxy = connection.proxies[hubName];

                    if (proxy) {
                        // Update the hub state
                        $.extend(proxy.state, data.State);
                        $(proxy).triggerHandler(
                            makeEventName(eventName),
                            [data.Args]);
                    }
                }
            });
        }
    });

    return $.callR;
})();
