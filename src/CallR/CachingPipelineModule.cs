using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CachingPipelineModule : HubPipelineModule
    {
        public override Func<IHubIncomingInvokerContext, Task<object>> BuildIncoming(Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return context =>
            {
                var cache = context
                    .MethodDescriptor
                    .Attributes
                    .Where(attr => attr.GetType() == typeof(object/*HubCacheAttribute*/))
                    .FirstOrDefault() as object;

                var isCached = false;
                var cachedVal = 0;

                if (null != cache && isCached)
                {
                    return Task.FromResult<object>(cachedVal);
                }

                return base.BuildIncoming(invoke)(context);
            };
        }
        
    }
}
