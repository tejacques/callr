using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CallRHub : Hub
    {
        public object Fields { get; set; }

        // Must DI IParameterResolver
        // 1) Pass in an additional parameter in javascript to
        //    hub.server.hubFunction with my special fields, like timeout
        // 2) Create and DI a custom IParameterResolver that includes this
        //    special argument even if it's not part of the Hub's
        //    methodDescriptor.
        // 3) Make a HubPipelineModule with a BuildIncoming method which
        //    grabs the special argument from the context.Args, uses it,
        //    and removes it from the Args if the actual Hub method doesn't
        //    have that parameter, then continues down the pipeline.
    }
}
