callr
=====

What is it?
-----------
A [SignalR](http://www.asp.net/signalr) Utility Library (C# and JavaScript).

Dependencies
------------

### CallR ###

* SignalR
* CallR.JS
* Polarize

### CallR.JS ###

* jQuery
* SignalR 

### CallR.Angular ###

* CallR
* AngularJS


How can I get it?
-----------------

CallR is available as a NuGet package: https://nuget.org/packages/CallR and a Bower package.

### CallR ###

#### NuGet ####

```
PM> Install-Package CallR
```

### CallR.JS ###

#### NuGet ####
```
PM> Install-Package CallR.JS
```

#### Bower ####

```
bower install callr
```

### CallR.Angular ###

#### NuGet ####

```
PM> Install-Package CallR.Angular
```

#### Bower ####

```
bower install callr.angular
```

Why was it made?
----------------

[SignalR](http://www.asp.net/signalr) is an amazing tool for real-time services in ASP.NET. CallR builds on top of SignalR to add a suite of utilities that make it easier to use SignalR effectively. The primary advantage of CallR is the queuing of requests to send a batch of calls to the server at once. This can help with mobile performance to minimize use of the radio on the phone. CallR.Angular also transforms SignalR hubs into a native Angular Module, which will properly apply scope changes so you don't have to. Finally, CallR extends SignalR by adding a set of optional parameters to calls, which allow for things like caching, filtering results, and timeouts for long requests.

Capabilities
------------

### C# ###

Extension methods / Static methods
* `SendToAll<THub>(this THub hub, string eventType, params object[] parameters)` (Extension method): Send the specified eventType with the provided parameters to all clients on the hub.
* `SendToAll<THub>(string eventType, params object[] parameters)`: Send the specified eventType with the provided parameters to all clients on the hub.
* `SendToClients(dynamic clients, string eventType, params object[] parameters)`: Send the specified eventType with the provided parameters to the provided clients.
* `SendToGroup<THub>(this THub hub, string groupName, string eventType, params object[] parameters)` (Extension method): Send the specified eventType with the provided parameters to the given group on the hub.
* `SendToGroup<THub>(string groupName, string eventType, params object[] parameters)`: Send the specified eventType with the provided parameters to the given group on the hub.
 
Added Functionality
* `app.ConfigureCallR()` (Extension method on IAppBuilder): Configures the CallR hub pipeline
* `CallRHub`: An implementation of Hub that allows access to `CallRParams`, which include the requested `Polarize` parameters: fields and constraints, as well as a requestTimeout in ms.
* `HubCache` (Attribute): Allows the result of a Hub method to be cached according to the a configurable set of parameters, including the method arguments, client state, client IP address, UserAgent, Authenticated Username, and ConnectionID. This allows for paginating cached results easily.

### JavaScript ###

#### CallR ####

* `hubModule.init(hubName)`: create a singleton hub with the given name or enhance a hub created by SignalR's autogenerated proxies.
* `hub.connect(options, callback)`: same as `hub.connection.start(options, callback)`
* `hub.disconnect(async, notifyServer)`: same as `hub.stop(async, notifyServer)`
* `hub.bindEvent(eventName, callback)`: same as `hub.on(eventName, callback)`
* `hub.unbindEvent(eventName, callback)`: same as `hub.off(eventName, callback)`
* `hub.rpc`: replaces hub.server for making calls to the back end. Sends any queued requests along with the current request. Also acts as a function that takes a request. See CallR Examples for more information.
* `hub.queue.rpc`: same as hub.rpc, but queues up calls to the server rather than immediately requesting them.
* `hub.flushRequests(cb)`: Send all queued requests to the server, then execute the callback once all requests has been completed. Will open a connection if necessary, and close the connection afterwards if it was closed when the flush began.
* `hub.addRPC(name, nameOnServer[, argumentName, ...])`: Creates a new rpc call with the provided name, name of the function on the server, and the names of the arguments. Calls to that function will verify that the number of arguments match.

#### CallR.Angular ####

* Angular Injectible HubModule, with HubFactory.
* `HubFactory.create(hubName)`: create a singleton hub with the given name or enhance a hub created by SignalR's autogenerated proxies. jQuery promises are converted to $q promises to automatically call $scope.$apply, allowing you to write clean familiar AngularJS.
* `hub.bindEvent(eventName, callback, scope)`: Optionally takes a scope. If supplied, scope.$digest() is called, otherwise, $rootScope.$apply() is called. Providing the scope is more efficient if you know that the changes will only affect the rendering of that scope.

Example Usage
-------------


### C# ###

#### From a Hub ####

``` csharp
[HubName("Chat")]
public class ChatHub : CallRHub
{
    public void Send(string name, string message)
    {
        // Call the sendMessage method to update clients.
        this.SendToAll(
            "message",
            new {
                name = name,
                message = message
            });
    }
    
    public object GetTestMessage(string name, string message)
    {
        return new {
            name = name,
            message = message
        };
    }
}
```

#### From outside the Hub ecosystem ####

``` csharp
public class ChatNotifier
{
    public void Send(string name, string message)
    {
        HubUtility.SendToAll<ChatHub>(name, message);
    }
}
```

### JavaScript ###

#### Hub RPC Calls ####

##### Using RPC Object #####
``` javascript
hub.rpc.methodName(arg[, ...]).done(function(result) {
    // Do something with result...
    console.log(result);
});

hub.rpc.methodName(arg[, ...], {
    // optional callRParams
    fields: ["field.path1", "field.path2"], // The fields to include in the result
    constraints: { // Constraints on the fields, currently only for array/list length and offset
        "field.path" : {
            offset: 0, // starting index in resulting array/list
            limit: 10  // number of results to return in array/list
        }
    },
    timeout: 1000 // ms timeout
});
```

##### Using RPC Function #####

``` javascript
hub.rpc({
    name: "methodName",
    params: [arg1, arg2, ...]
});

hub.rpc({
    name: "methodName",
    params: arg
});

hub.rpc({
    name: "methodName",
    params: arg,
    // optional callRParams
    fields: ["field.path1", "field.path2"], // The fields to include in the result
    constraints: { // Constraints on the fields, currently only for array/list length and offset
        "field.path" : {
            offset: 0, // starting index in resulting array/list
            limit: 10  // number of results to return in array/list
        }
    },
    timeout: 1000 // ms timeout
});
```

#### CallR ####

``` javascript
var hub = hubModule
    .init("Chat")
    .addRPC("send");

var messages = [];

hub.bindEvent("message", function(message) {
    console.log("Received: " + message);
    messages.push(message);
});

hub.connect().done(function() {
    $("#sendMessage").click(function () {
        hub.rpc.send("TestName", "TestMessage");
    });
    
    $("#getTestMessage1").click(function () {
        // Method 1
        hub.rpc.getTestMessage("TestName", "TestMessage").done(function(message) {
            console.log(message);
        });
    });
    
    $("#getTestMessage2").click(function () {
        // Method 2
        hub.rpc({
            name: "getTestMessage",
            params: ["TestName", "TestMessage"]
        }).done(function(message) {
            console.log(message);
        });
    });
});
```

#### CallR.Angular ####

``` javascript
var chatApp = angular.module('chatApp', ['hubModule']);

chatApp.controller('ChatController', ['$scope', 'hubFactory',
    function ($scope, hubFactory) {
        $scope.messages = [];
        
        var hub = hubFactory
            .create("Chat")
            .addRPC("send", "Send", "name", "message");
        
        hub.bindEvent("message", function(message) {
            console.log("Received: " + message);
            $scope.messages.push(message);
            // No need to call $scope.$apply()!
        });
        
        $scope.sendMessage = function(name, message) {
            hub.rpc.send(name, message);
        }
        
        $scope.getTestMessage1 = function(name, message) {
            // Method 1
            hub.rpc.getTestMessage("TestName", "TestMessage").then(function(message) {
                console.log(message);
            });
        }
        
        $scope.getTestMessage2 = function(name, message) {
            // Method 2
            hub.rpc({
                name: "getTestMessage",
                params: ["TestName", "TestMessage"]
            }).then(function(message) {
                console.log(message);
            });
        }
    }
]);
```

