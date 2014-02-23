using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.Owin;
using Owin;
using System;
[assembly: OwinStartup(typeof(CallR.Sample.Startup))]
namespace CallR.Sample
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Any connection or hub wire up and configuration should go here
            var lazyParamResolver = new Lazy<CallRParameterResolver>();
            GlobalHost.DependencyResolver.Register(typeof(IParameterResolver),
                () => lazyParamResolver.Value);

            var lazyMethodDescriptorProvider = 
                new Lazy<CallRMethodDescriptorProvider>();
            GlobalHost.DependencyResolver.Register(
                typeof(IMethodDescriptorProvider),
                () => lazyMethodDescriptorProvider.Value);

            GlobalHost.HubPipeline.AddModule(new CallRPipelineModule());
            app.MapSignalR();
        }
    }
}