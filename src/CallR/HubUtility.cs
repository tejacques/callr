using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.CSharp.RuntimeBinder;
using System;
using System.Runtime.CompilerServices;
using System.Collections.Concurrent;

namespace CallR
{
    public static class HubUtility
    {
        /// <summary>
        /// Sends an event with the specified parameters to the given clients.
        /// </summary>
        /// <param name="clients">The clients to send to</param>
        /// <param name="eventType">The type of event</param>
        /// <param name="parameters">The event parameters</param>
        public static void SendToClients(dynamic clients, string eventType, params object[] parameters)
        {
            var signalProxy = (SignalProxy)clients;
            signalProxy.Invoke(eventType, parameters);
        }

        public static void SendToGroup<THub>(this THub hub, string groupName, string type, params object[] parameters)
            where THub : IHub
        {
            var clients = hub.Clients.Group(groupName);
            SendToClients(clients, type, parameters);
        }

        public static void SendToAll<THub>(this THub hub, string type, params object[] parameters)
            where THub : IHub
        {
            var clients = hub.Clients.All;
            SendToClients(clients, type, parameters);
        }

        public static void SendToGroup<THub>(string groupName, string type, params object[] parameters)
            where THub : IHub
        {
            var hub = GlobalHost.ConnectionManager.GetHubContext<THub>();
            var clients = hub.Clients.Group(groupName);
            SendToClients(clients, type, parameters);
        }

        public static void SendToAll<THub>(string type, params object[] parameters)
            where THub : IHub
        {
            var hub = GlobalHost.ConnectionManager.GetHubContext<THub>();
            var clients = hub.Clients.All;
            SendToClients(clients, type, parameters);
        }

    }
}