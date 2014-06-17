using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// Extension method for configuring CallR
    /// </summary>
    public static class IAppBuilderExtensions
    {
        /// <summary>
        /// Extension method to configure's CallR with the default
        /// </summary>
        /// <param name="app">The Owin IAppBuilder</param>
        public static void ConfigureCallR(this IAppBuilder app)
        {
            var lazyRequestParser = new Lazy<CallRHubRequestParser>();
            GlobalHost.DependencyResolver.Register(typeof(IHubRequestParser),
                () => lazyRequestParser.Value);

            var lazyParamResolver = new Lazy<CallRParameterResolver>();
            GlobalHost.DependencyResolver.Register(typeof(IParameterResolver),
                () => lazyParamResolver.Value);

            var lazyMethodDescriptorProvider = 
                new Lazy<CallRMethodDescriptorProvider>();
            GlobalHost.DependencyResolver.Register(
                typeof(IMethodDescriptorProvider),
                () => lazyMethodDescriptorProvider.Value);

            GlobalHost.HubPipeline.AddModule(new CallRPipelineModule());
            GlobalHost.HubPipeline.AddModule(new CachingPipelineModule());
        }
    }
}
