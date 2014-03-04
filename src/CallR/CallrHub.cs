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
    public class CallRHub : Hub
    {
        /// <summary>
        /// The special parameters to CallR
        /// </summary>
        public CallRParams Parameters { get; set; }
    }
}
