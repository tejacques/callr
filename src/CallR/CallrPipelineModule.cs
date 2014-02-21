using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CallrPipelineModule : HubPipelineModule
    {
        public override Func<IHubIncomingInvokerContext, Task<object>> 
            BuildIncoming(
                Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return context =>
            {
                if (OnBeforeIncoming(context))
                {
                    if (typeof(CallrHub)
                        .IsAssignableFrom(
                        context.MethodDescriptor.Hub.HubType))
                    {
                        var cache = context
                            .MethodDescriptor
                            .Attributes
                            .Where(attr => attr.GetType() == typeof(object/*HubCacheAttribute*/))
                            .FirstOrDefault() as object;
                    }
                    return base.BuildIncoming(invoke)(context);
                }

                return Task.FromResult<object>(null);
            };
        }

        protected override bool OnBeforeIncoming(IHubIncomingInvokerContext context)
        {
            return base.OnBeforeIncoming(context);
        }
    }
}
