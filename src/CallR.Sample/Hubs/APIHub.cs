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

        public object GetTest()
        {
            return new {
                channel = "TestChannel",
                name = "TestName",
                message = "TestMessage"
            };
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