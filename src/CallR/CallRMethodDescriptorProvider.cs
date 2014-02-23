using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CallRMethodDescriptorProvider : IMethodDescriptorProvider
    {
        private readonly ReflectedMethodDescriptorProvider _provider;

        public CallRMethodDescriptorProvider()
        {
            _provider = new ReflectedMethodDescriptorProvider();
        }

        public IEnumerable<MethodDescriptor> GetMethods(HubDescriptor hub)
        {
            return _provider.GetMethods(hub);
        }

        public bool TryGetMethod(HubDescriptor hub, string method, out MethodDescriptor descriptor, IList<IJsonValue> parameters)
        {
            if (!_provider
                .TryGetMethod(hub, method, out descriptor, parameters))
            {
                var paramsWithoutLast = parameters.ToList();
                paramsWithoutLast.RemoveAt(paramsWithoutLast.Count - 1);

                _provider.TryGetMethod(
                    hub, method, out descriptor, paramsWithoutLast);
            }

            return descriptor != null;
        }
    }
}
