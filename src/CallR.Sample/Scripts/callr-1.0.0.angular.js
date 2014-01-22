/*!
* callr JavaScript Library v1.0.0 AngularJS factory
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

function hubModuleFactory($provide) {
    $provide.factory('signalr', ['$', '$q', '$rootScope',
        function ($, $q, $rootScope) {
            return {
                init: function (hubName) {
                    if ($.connection[hubName] && $.connection[hubName].api) {
                        return $.connection[hubName];
                    }

                    var hub = hubModule.init(hubName);

                    function autoApplyAPI(api) {
                        $.each(hub[api], function (el) {
                            var fn = hub[api][el];
                            hub[api][el] = function () {
                                var args = $.makeArray(arguments);
                                var promise = fn.apply(null, args);

                                // Convert to $q promise from jQuery promise
                                var qpromise = $q.when(promise);
                                return qpromise;
                            };
                        });
                    }

                    function autoApplyFn(fname) {
                        var fn = hub[fname];
                        hub[fname] = function () {

                            var args = $.makeArray(arguments);
                            var promise = fn.apply(this, args);

                            // Convert to $q promise from jQuery promise
                            var qpromise = $q.when(promise);
                            return qpromise;
                        };
                    }

                    
                    hub.bindEvent = function (eventName, callback) {
                        hub.on(eventName, function () {
                            var args = $.makeArray(arguments);
                            callback.apply(this, args);
                            $rootScope.$apply();
                        });
                    }

                    autoApplyAPI("api");
                    autoApplyAPI("queueApi");
                    autoApplyFn("connect");

                    return hub;
                }
            }
        }
    ]);
}