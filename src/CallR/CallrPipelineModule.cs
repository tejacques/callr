using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CallRPipelineModule : HubPipelineModule
    {
        public override Func<IHubIncomingInvokerContext, Task<object>> 
            BuildIncoming(
                Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return async context =>
            {
                if (OnBeforeIncoming(context))
                {
                    if (typeof(CallRHub)
                        .IsAssignableFrom(
                        context.MethodDescriptor.Hub.HubType))
                    {
                        var hub = (CallRHub)context.Hub;

                        var expectedNum = context
                            .MethodDescriptor
                            .Parameters
                            .Where(descriptor =>
                                descriptor.ParameterType == typeof(object))
                            .Count();

                        var actual = context
                            .Args
                            .Where(o => o.GetType() == typeof(object));

                        var actualNum = actual.Count();

                        if (actualNum > 0)
                        {
                            hub.Fields = actual.Last();
                        }

                        if (actualNum > expectedNum)
                        {
                            var toRemove = actual.Skip(expectedNum);
                            foreach (var rem in toRemove)
                            {
                                context.Args.Remove(rem);
                            }
                        }

                        var res = await base.BuildIncoming(invoke)(context);

                        if (actualNum > 0)
                        {
                            return res;
                            // return FilterJson.Create(res, hub.Fields);
                        }

                        return res;
                    }

                    return await base.BuildIncoming(invoke)(context);
                }
                return null;
            };
        }
    }
}
