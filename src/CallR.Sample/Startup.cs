using CallR.Sample.Hubs;
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
            // Log all exceptions from SignalR
            GlobalHost.HubPipeline.AddModule(
                new ExceptionLoggingPipelineModule());

            // Any connection or hub wire up and configuration should go here
            var hubConfiguration = new HubConfiguration
            {
                EnableDetailedErrors = true
            };
            app.ConfigureCallR();
            app.MapSignalR(hubConfiguration); ;
        }
    }
}