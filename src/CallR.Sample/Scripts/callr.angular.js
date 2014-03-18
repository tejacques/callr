/*!
* callr JavaScript Library v1.1.0 AngularJS Module
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

(function () {
    angular.module('hubModule', []).
    factory('hubFactory', ['$q', '$rootScope',
        function ($q, $rootScope) {
            var resources = {
                nojQuery: "jQuery was not found. Please ensure jQuery is referenced before the CallR.Angular client JavaScript file.",
                noSignalR: "SignalR was not found. Please ensure SignalR is referenced before the CallR.Angular client JavaScript file.",
                noCallR: "CallR was not found. Please ensure CallR is referenced before the CallR.Angular client JavaScript file."
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

            if (typeof ($.callR) === 'undefined') {
                // no CallR!
                throw new Error(resources.noCallR);
            }

            return {
                create: function (hubName) {
                    if ($.connection[hubName] && $.connection[hubName].rpc) {
                        return $.connection[hubName];
                    }

                    var hub = $.callR.init(hubName);

                    function convertToAngularPromise(fn) {
                        return (function () {
                            var args = [].slice.call(arguments);
                            var promise = fn.apply(null, args);

                            // Convert to $q promise from jQuery promise
                            var qpromise = $q.when(promise);
                            return qpromise;
                        });
                    }

                    function autoApplySpecific(base, name) {
                        var fn = base[name];
                        base[name] = convertToAngularPromise(fn);
                    }

                    function autoApplyAll(base) {
                        $.each(base, function (name) {
                            autoApplySpecific(base, name);
                        });
                    }

                    var _eventCallbacks = {};
                    hub.bindEvent = function (eventName, callback, scope) {
                        var cb = function () {
                            var args = [].slice.call(arguments);
                            callback.apply(this, args);

                            // If a specific scope was supplied, use it.
                            if (typeof (scope) !== 'undefined') {
                                scope.$digest();
                            } else {
                                $rootScope.$apply();
                            }
                        };
                        _eventCallbacks[callback] = cb;

                        hub.on(eventName, cb);
                    };

                    // Refer to the mapped callback
                    hub.unbindEvent = function (eventName, callback) {
                        if (_eventCallbacks[callback]) {
                            hub.off(eventName, _eventCallbacks[callback]);
                            delete _eventCallbacks[callback];
                        }
                    };

                    var _addRPC = hub.addRPC;
                    hub.addRPC = function (name, nameOnServer) {
                        var args = [].slice.call(arguments);
                        _addRPC.apply(this, args);
                        autoApplySpecific(hub.rpc, name);
                        autoApplySpecific(hub.queue.rpc, name);
                        return this;
                    }

                    hub._myRPC = convertToAngularPromise(hub._myRPC);
                    hub._myQueueRPC = convertToAngularPromise(hub._myQueueRPC);
                    autoApplyAll(hub.rpc);
                    autoApplyAll(hub.queue.rpc);
                    autoApplySpecific(hub, "connect");

                    return hub;
                }
            }
        }
    ]);
})();