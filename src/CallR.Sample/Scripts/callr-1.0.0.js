﻿/*!
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
    var resources = {
        nojQuery: "jQuery was not found. Please ensure jQuery is referenced before the CallR client JavaScript file.",
        noSignalR: "SignalR was not found. Please ensure SignalR is referenced before the CallR client JavaScript file."
    };

    var $ = window.jQuery;

    if (typeof ($) !== "function") {
        // no jQuery!
        throw new Error(resources.nojQuery);
    }

    if (typeof ($.signalR) !== "function") {
        // no SignalR!
        throw new Error(resources.noSignalR);
    }

    // Initialize a new hub by name
    var init = function (hubName) {

        var conn = $.connection.hub,
            hub = $.connection[hubName];

        if (!$.connection.hub.id) {
            conn = $.hubConnection();
            $.connection.hub = conn;
            hub = conn.createHubProxy(hubName);
        }

        if (hub.callR) {
            // Already initialized
            return hub;
        }

        hub.callR = true;
        hub.bindEvent = hub.on;

        hub.unbindEvent = hub.off;

        // The context of conn.start must be the conn
        // We're using a function wrapper here instead
        // of .bind for better browser support.
        hub.connect = function (options, callback) {
            return conn.start(options, callback);
        };

        // The context of conn.stop must be the conn
        // We're using a function wrapper here instead
        // of .bind for better browser support.
        hub.disconnect = function (async, notifyServer) {
            return conn.hub.stop(async, notifyServer);
        };

        var _requestQueue = [];
        function queueRequest (request) {
            var deferred = $.Deferred();

            _requestQueue.push([request, deferred]);

            return deferred.promise();
        }

        hub.flushRequests = function (cb) {
            var requestsRemaining = _requestQueue.length;

            if (requestsRemaining === 0) {
                hub.connection.log("No requests to flush");
                if (typeof (cb) === 'function') {
                    cb();
                }
                return;
            }

            hub.connection.log("Flushing request queue");

            var closeAfter = false;
            if (conn.state === $.signalR.connectionState.disconnected) {
                closeAfter = true;
            }

            var requestComplete = function () {
                requestsRemaining--;
                if (requestsRemaining === 0) {
                    // All requests complete
                    hub.connection.log("Finished flushing request queue");
                    if (closeAfter) {
                        hub.disconnect();
                    }

                    if (typeof (cb) === 'function') {
                        cb();
                    }
                }
            };

            function _queueRequest(request, deferred) {
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

            hub.connect().then(function () {
                var len = _requestQueue.length;
                for (var i = 0; i < len; i++) {
                    _queueRequest(_requestQueue[i][0], _requestQueue[i][1]);
                }

                _requestQueue = [];
            });
        };

        function _request (promise) {
            hub.flushRequests();
            return promise;
        }

        hub.rpc = {};
        hub.queue = { rpc: {} };

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

        hub.addRPC = function (name, nameOnServer) {
            var argNames = [].slice.call(arguments).slice(2);
            function rpcCall() {
                var args = [].slice.call(arguments);
                if (argNames.length !== args.length) {
                    throw new Error(name + " expected " + argNames.length +
                        " arguments: " + argNames.join(", ") +
                        " but only had " + args.length);
                }
                return hub.invoke.apply(hub, $.merge([nameOnServer], args));
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
        "init": init
    };

    return $.callR;
})();
