using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// A specific implementation of a Hub that
    /// allows access to the CallRParams
    /// </summary>
    public abstract class CallRHub : Hub
    {
        /// <summary>
        /// The special parameters to CallR
        /// </summary>
        public CallRParams Parameters { get; set; }

        //CallRGroupManager _groups;

        ///// <summary>
        ///// The group manager for this CallRHub instance.
        ///// </summary>
        //public new IGroupManager Groups
        //{
        //    get
        //    {
        //        return _groups;
        //    }
        //    set
        //    {
        //        _groups = new CallRGroupManager(value, this.Clients);
        //    }
        //}
    }
}
