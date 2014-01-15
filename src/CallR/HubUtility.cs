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
        private static ConcurrentDictionary<
            string, CallSite<Action<CallSite, object>>> _callsiteDictionary0 =
            new ConcurrentDictionary<string, CallSite<Action<CallSite, object>>>();
        private static ConcurrentDictionary<string, CallSite<Action<CallSite, object, object>>> _callsiteDictionary1 =
            new ConcurrentDictionary<string, CallSite<Action<CallSite, object, object>>>();
        private static ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object>>> _callsiteDictionary2 =
            new ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object>>>();
        private static ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object>>> _callsiteDictionary3 =
            new ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object>>>();
        private static ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object, object>>> _callsiteDictionary4
            = new ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object, object>>>();
        private static ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object, object, object>>> _callsiteDictionary5
            = new ConcurrentDictionary<string, CallSite<Action<CallSite, object, object, object, object, object, object>>>();
        public static void SendToClients(dynamic clients, string eventType, params object[] parameters)
        {
            switch(parameters.Length)
            {
                case 0:
                    var site0 = _callsiteDictionary0.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site0.Target(site0, clients);
                    break;
                case 1:
                    var site1 = _callsiteDictionary1.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site1.Target(site1, clients, parameters[0]);
                    break;
                case 2:
                    var site2 = _callsiteDictionary2.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object, object, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site2.Target(site2, clients, parameters[0], parameters[1]);
                    break;
                case 3:
                    var site3 = _callsiteDictionary3.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object, object, object, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site3.Target(site3, clients, parameters[0], parameters[1], parameters[2]);
                    break;
                case 4:
                    var site4 = _callsiteDictionary4.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object, object, object, object, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site4.Target(site4, clients, parameters[0], parameters[1], parameters[2], parameters[3]);
                    break;
                case 5:
                    var site5 = _callsiteDictionary5.GetOrAdd(eventType, (evType) =>
                            CallSite<Action<CallSite, object, object, object, object, object, object>>.Create(
                                Binder.InvokeMember(
                                    CSharpBinderFlags.ResultDiscarded,
                                    eventType,
                                    null,
                                    typeof(HubUtility),
                                    new CSharpArgumentInfo[] {
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.None, null),
                                    CSharpArgumentInfo.Create(CSharpArgumentInfoFlags.UseCompileTimeType, null)
                                })));

                    site5.Target(site5, clients, parameters[0], parameters[1], parameters[2], parameters[3], parameters[4]);
                    break;
            }
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