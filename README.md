callr
=====

What is it?
-----------
A [SignalR](http://www.asp.net/signalr) Utility Library (C# and JavaScript).

Dependencies
------------

### CallR ###

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

[SignalR](http://www.asp.net/signalr) is an amazing tool for real-time services in ASP.NET. CallR builds on top of SignalR to add a suite of utilities that make it easier to use SignalR effectively. The primary advantage of CallR is the queuing of requests to send a batch of calls to the server at once. This can help with mobile performance to minimize use of the radio on the phone. CallR.Angular also transforms SignalR hubs into a native Angular Module, which will properly apply scope changes so you don't have to.

Capabilities
------------

### C# ###

Extension methods / Static methods
* SendToAll<THub>(this THub hub, string type, params object[] parameters)
* SendToAll<THub>(string type, params object[] parameters)
* SendToClients(dynamic clients, string eventType, params object[] parameters)
* SendToGroup<THub>(this THub hub, string groupName, string type, params object[] parameters)
* SendToGroup<THub>(string groupName, string type, params object[] parameters)

### JavaScript ###

#### CallR ####

* HubModule.init(hubName): create a singleton hub with the given name or enhance a hub created by SignalR's autogenerated proxies.
* hub.connect(): same as hub.start
* hub.disconnect(async, notifyServer): same as hub.stop
* hub.bindEvent(eventName, callback): same as hub.on
* hub.unbindEvent(eventName, callback): same as hub.off
* hub.rpc: replaces hub.server for making calls to the back end. Sends any queued requests along with the current request.
* hub.queue.rpc: same as hub.rpc, but queues up calls to the server rather than immediately requesting them.
* hub.flushRequests(cb): Send all queued requests to the server, then execute the callback once all requests has been completed. Will open a connection if necessary, and close the connection afterwards if it was closed when the flush began.
* hub.addRPC(name, nameOnServer[, argumentNames, ...]): Creates a new rpc call with the provided name, name of the function on the server, and the names of the arguments. Calls to that function will verify that the number of arguments match.

#### CallR.Angular ####

* Angular Injectible HubModule, with HubFactory.
* HubFactory.create(hubName): create a singleton hub with the given name or enhance a hub created by SignalR's autogenerated proxies. jQuery promises are converted to $q promises to automatically call $scope.$apply, allowing you to write clean familiar AngularJS.

Example Usage
-------------


### C# ###

#### From a Hub ####

``` csharp
[HubName("Chat")]
public class ChatHub : Hub
{
    public void Send(string channel, string name, string message)
    {
        // Call the sendMessage method to update clients.
        this.SendToGroup(
            channel,
            "message",
            new {
                channel = channel,
                name = name,
                message = message
            });
    }
}
```

#### From outside the Hub ecosystem ####

``` csharp
public class ChatNotifier
{
    public void Send(string channel, string name, string message)
    {
        HubUtility.SendToGroup<ChatHub>(channel, name, message);
    }
}
```

### JavaScript ###

#### CallR ####

``` javascript
var hub = hubModule
    .init("Chat")
    .addRPC("send", "Send", "channel", "name", "message");

var messages = [];

hub.bindEvent("message", function(message) {
    console.log("Received: " + message);
    messages.push(message);
});

hub.connect().done(function() {
    $("#sendMessage").click(function () {
        hub.rpc.send("TestChannel", "TestName", "TestMessage");
    });
});
```

#### CallR.Angular ####

``` javascript
var chatApp = angular.module('chatApp', ['hubModule']);

chatApp.controller('ChatController', ['$scope', 'hubFactory',
    function ($scope, hubFactory) {
        $scope.messages = [];
        
        $scope.hub = hubFactory
            .create("Chat")
            .addRPC("send", "Send", "channel", "name", "message");
        
        $scope.hub.bindEvent("message", function(message) {
            console.log("Received: " + message);
            $scope.messages.push(message);
            // No need to call $scope.$apply()!
        });
        
        $scope.sendMessage = function(channel, name, message) {
            $scope.hub.rpc.send(channel, name, message);
        }
    }
]);
```

