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

                        var customType = typeof(string[]);
                        var expectedNum = context
                            .MethodDescriptor
                            .Parameters
                            .Where(descriptor =>
                                descriptor.ParameterType == customType)
                            .Count();

                        var actual = context
                            .Args
                            .Where(o => o.GetType() == customType);

                        var actualNum = actual.Count();

                        if (actualNum > 0)
                        {
                            hub.Fields = actual.Last();
                        }

                        if (actualNum > expectedNum)
                        {
                            var toRemove = actual.Skip(expectedNum).ToArray();
                            try
                            {
                                foreach (var rem in toRemove)
                                {
                                    context.Args.Remove(rem);
                                }
                            }
                            catch (Exception e)
                            {
                                Console.WriteLine(e);
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
