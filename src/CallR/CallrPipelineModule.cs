using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Polarize;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// The SinglaR HubPipelineModule for CallR
    /// </summary>
    public class CallRPipelineModule : HubPipelineModule
    {
        /// <summary>
        /// Overridden BuildIncoming method which removes the optional
        /// parameters from the HubMethod call if they are not used.
        /// </summary>
        /// <param name="invoke">The passed in function.</param>
        /// <returns>A modified version of the passed in function.</returns>
        public override Func<IHubIncomingInvokerContext, Task<object>> 
            BuildIncoming(
                Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return async context =>
            {
                if (typeof(CallRHub)
                    .IsAssignableFrom(
                    context.MethodDescriptor.Hub.HubType))
                {
                    var hub = (CallRHub)context.Hub;

                    var customType = typeof(CallRParams);
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
                        hub.Parameters = actual.Last() as CallRParams;
                    }

                    if (actualNum > expectedNum)
                    {
                        var toRemove = actual.Skip(expectedNum).ToArray();

                        foreach (var rem in toRemove)
                        {
                            context.Args.Remove(rem);
                        }
                    }

                    var res = await base.BuildIncoming(invoke)(context);

                    if (actualNum > expectedNum)
                    {
                        return JsonFilter.Create(
                            res, hub.Parameters.Fields);
                    }

                    return res;
                }

                return await base.BuildIncoming(invoke)(context);
            };
        }
    }
}
