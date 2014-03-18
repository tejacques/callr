using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace CallR.Sample.Hubs
{
    [HubName("API")]
    public class APIHub : CallRHub
    {
        public override Task OnConnected()
        {
            Clients.Caller.User = "TestUser";
            Clients.Caller.connected();
            return base.OnConnected();
        }
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

        [HubCache(
            CacheMethod:CacheMethod.Arguments|CacheMethod.StateKey,
            StateKey:"User",
            Minutes:5)]
        public object GetTest()
        {
            return new {
                channel = "TestChannel",
                name = "TestName",
                message = "TestMessage"
            };
        }

        [HubCache(
            CacheMethod: CacheMethod.Arguments | CacheMethod.StateKey,
            StateKey: "User",
            Minutes: 5)]
        public object GetTest(
            string channel,
            string name,
            string message,
            string[] extra)
        {
            return new
            {
                channel = channel,
                name = name,
                message = message
            };
        }

        [HubCache(
            CacheMethod: CacheMethod.Arguments | CacheMethod.StateKey,
            StateKey: "User",
            Minutes: 5)]
        public object GetTestList(
            string channel,
            string name,
            string message,
            int num)
        {
            var res = new
            {
                channel = channel,
                name = name,
                message = message
            };

            List<object> l = new List<object>();

            for(int i = 0; i < num; i++)
            {
                l.Add(res);
            }

            return l;
        }

        public void SendTest()
        {
            this.SendToAll(
                "message",
                new {
                    channel = "TestChannel",
                    name = "TestName",
                    message = "TestMessage"
                });
        }

        public Task Subscribe(string channel)
        {
            return Groups.Add(this.Context.ConnectionId, channel);
        }

        public Task Unsubscribe(string channel)
        {
            return Groups.Remove(this.Context.ConnectionId, channel);
        }

    }
}