using CallR.Sample.Hubs;
using CallR.Sample.Serializers;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.Owin;
using Newtonsoft.Json;
using Owin;
using System;
[assembly: OwinStartup(typeof(CallR.Sample.Startup))]
namespace CallR.Sample
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Custom Serialization Set Up
            // Define Json.Net Serialization Settings
            var settings = new JsonSerializerSettings();

            // Serialize/Deserialize Enum Flags as a list of longs
            settings.Converters.Add(new FlagEnumJsonConverter());

            // Configure Default Settings
            JsonConvert.DefaultSettings = (() => settings);

            // Configure SignalR serialization.
            var jsonSerializer = JsonSerializer.Create(settings);
            GlobalHost.DependencyResolver.Register(typeof(JsonSerializer), () => jsonSerializer);

            // Log all exceptions from SignalR
            GlobalHost.HubPipeline.AddModule(
                new ExceptionLoggingPipelineModule());

            // Any connection or hub wire up and configuration should go here
            var hubConfiguration = new HubConfiguration
            {
                EnableDetailedErrors = true
            };
            app.ConfigureCallR();
            app.MapSignalR(hubConfiguration);
        }
    }
}