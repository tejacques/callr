using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Diagnostics;

namespace CallR.Sample.Hubs
{

    public class ExceptionLoggingPipelineModule : HubPipelineModule
    {
        protected override void OnIncomingError(
            ExceptionContext exceptionContext,
            IHubIncomingInvokerContext invokerContext)
        {
            Debug.WriteLine(
                "SignalR Exception thrown: {0}",
                exceptionContext.Error);
            base.OnIncomingError(exceptionContext, invokerContext);
        }
    }
}