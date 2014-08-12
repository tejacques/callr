using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// A GroupManager that informs the client of actions.
    /// </summary>
    public class CallRGroupManager : IGroupManager
    {
        private IGroupManager _groups;
        private IHubCallerConnectionContext<dynamic> _clients;

        /// <summary>
        /// Creates a CallRGroupManager which sends a notification to the
        /// client when it is added to or removed from a group.
        /// </summary>
        /// <param name="groups">The group manager to be wrapped.</param>
        /// <param name="clients">The SignalR clients.</param>
        public CallRGroupManager(
            IGroupManager groups,
            IHubCallerConnectionContext<dynamic> clients)
        {
            this._groups = groups;
            this._clients = clients;
        }

        /// <summary>
        /// Adds the specified connectionId to the given groupName, and sends
        /// the client a notification.
        /// </summary>
        /// <param name="connectionId">
        /// The connection to add to the group.
        /// </param>
        /// <param name="groupName">The group to add the connection to.</param>
        /// <returns>A task representing this action.</returns>
        public Task Add(string connectionId, string groupName)
        {
            _clients.Client(connectionId).addGroup(groupName);
            return _groups.Add(connectionId, groupName);
        }

        /// <summary>
        /// Removes the specified connectionId to the given groupName, and
        /// sends the client a notification.
        /// </summary>
        /// <param name="connectionId">
        /// The connection to remove from the group.
        /// </param>
        /// <param name="groupName">
        /// The group to remove the connection from.
        /// </param>
        /// <returns>A task representing this action.</returns>
        public Task Remove(string connectionId, string groupName)
        {
            _clients.Client(connectionId).removeGroup(groupName);
            return _groups.Remove(connectionId, groupName);
        }
    }
}
