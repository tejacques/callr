using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.CSharp.RuntimeBinder;
using System;
using System.Runtime.CompilerServices;
using System.Collections.Concurrent;

namespace CallR
{
    /// <summary>
    /// Utility functions for interacting with Hubs in SignalR
    /// </summary>
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
            var signalProxy = (IClientProxy)clients;
            signalProxy.Invoke(eventType, parameters);
        }

        /// <summary>
        /// Sends an event with the specified parameters
        /// to the given group in the specified hub.
        /// </summary>
        /// <typeparam name="THub">The hub type</typeparam>
        /// <param name="hub">The hub</param>
        /// <param name="groupName">The group name</param>
        /// <param name="eventType">The event type</param>
        /// <param name="parameters">The event parameters</param>
        public static void SendToGroup<THub>(this THub hub, string groupName, string eventType, params object[] parameters)
            where THub : IHub
        {
            var clients = hub.Clients.Group(groupName);
            SendToClients(clients, eventType, parameters);
        }

        /// <summary>
        /// Sends an event with the specified parameters
        /// to everyone in the specified hub.
        /// </summary>
        /// <typeparam name="THub">The hub type</typeparam>
        /// <param name="hub">The hub</param>
        /// <param name="eventType">The event type</param>
        /// <param name="parameters">The event parameters</param>
        public static void SendToAll<THub>(this THub hub, string eventType, params object[] parameters)
            where THub : IHub
        {
            var clients = hub.Clients.All;
            SendToClients(clients, eventType, parameters);
        }

        /// <summary>
        /// Sends an event with the specified parameters
        /// to the given group in the specified hub.
        /// </summary>
        /// <typeparam name="THub">The hub type</typeparam>
        /// <param name="groupName">The group name</param>
        /// <param name="eventType">The event type</param>
        /// <param name="parameters">The event parameters</param>
        public static void SendToGroup<THub>(string groupName, string eventType, params object[] parameters)
            where THub : IHub
        {
            var hub = GlobalHost.ConnectionManager.GetHubContext<THub>();
            var clients = hub.Clients.Group(groupName);
            SendToClients(clients, eventType, parameters);
        }

        /// <summary>
        /// Sends an event with the specified parameters
        /// to everyone in the specified hub.
        /// </summary>
        /// <typeparam name="THub">The hub type</typeparam>
        /// <param name="eventType">The event type</param>
        /// <param name="parameters">The event parameters</param>
        public static void SendToAll<THub>(string eventType, params object[] parameters)
            where THub : IHub
        {
            var hub = GlobalHost.ConnectionManager.GetHubContext<THub>();
            var clients = hub.Clients.All;
            SendToClients(clients, eventType, parameters);
        }

    }
}