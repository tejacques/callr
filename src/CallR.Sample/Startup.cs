using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
[assembly: OwinStartup(typeof(CallR.Sample.Startup))]
namespace CallR.Sample
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Any connection or hub wire up and configuration should go here
            app.MapSignalR();
        }
    }
}