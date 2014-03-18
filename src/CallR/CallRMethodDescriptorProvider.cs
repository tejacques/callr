using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// An implementation of IMethodDescriptorProvider which uses a
    /// ReflectedMethodDescriptorProvider under the hood, retrying
    /// failed lookups without the last parameter, which may be optional
    /// CallRParameters in CallR.
    /// </summary>
    public class CallRMethodDescriptorProvider : IMethodDescriptorProvider
    {
        private readonly ReflectedMethodDescriptorProvider _provider;
        private readonly ConcurrentDictionary<string, MethodDescriptor>
            _executableMethods;

        /// <summary>
        /// The default constructor.
        /// </summary>
        public CallRMethodDescriptorProvider()
        {
            _provider = new ReflectedMethodDescriptorProvider();
            _executableMethods = 
                new ConcurrentDictionary<string, MethodDescriptor>();
        }

        /// <summary>
        /// A fall-through to the underlying ReflectedMethodDescriptorProvider.
        /// </summary>
        /// <param name="hub">The hub to get the methods for.</param>
        /// <returns>The method descriptors for the requested hub.</returns>
        public IEnumerable<MethodDescriptor> GetMethods(HubDescriptor hub)
        {
            return _provider.GetMethods(hub);
        }

        /// <summary>
        /// Attempts to get the method descriptor with the provided arguments.
        /// </summary>
        /// <param name="hub">The hub the request is going to.</param>
        /// <param name="method">The name of the method in the hub.</param>
        /// <param name="descriptor">
        /// The method descriptor for the method.
        /// </param>
        /// <param name="parameters">
        /// The parameters supplied to the method.
        /// </param>
        /// <returns>true if found, false otherwise.</returns>
        public bool TryGetMethod(
            HubDescriptor hub,
            string method, 
            out MethodDescriptor descriptor,
            IList<IJsonValue> parameters)
        {
            var hubMethodKey = BuildHubExecutableMethodCacheKey(
                hub, method, parameters);

            if (!_executableMethods.TryGetValue(hubMethodKey, out descriptor))
            {
                if (!_provider
                    .TryGetMethod(hub, method, out descriptor, parameters))
                {
                    var paramsWithoutLast = parameters.ToList();
                    paramsWithoutLast.RemoveAt(paramsWithoutLast.Count - 1);

                    _provider.TryGetMethod(
                        hub, method, out descriptor, paramsWithoutLast);
                }

                // If an executable method was found, cache it for future
                // lookups (NOTE: we don't cache null instances because it
                // could be a surface area for DoS attack by supplying random
                // method names to flood the cache)
                if (descriptor != null)
                {
                    _executableMethods.TryAdd(hubMethodKey, descriptor);
                }
            }

            return descriptor != null;
        }

        private static string BuildHubExecutableMethodCacheKey(
            HubDescriptor hub,
            string method,
            IList<IJsonValue> parameters)
        {
            string normalizedParameterCountKeyPart;

            if (parameters != null)
            {
                normalizedParameterCountKeyPart = parameters.Count.ToString(
                    CultureInfo.InvariantCulture);
            }
            else
            {
                // NOTE: we normalize a null parameter array to be the same
                // as an empty (i.e. Length == 0) parameter array
                normalizedParameterCountKeyPart = "0";
            }

            // NOTE: we always normalize to all uppercase since method names
            // are case insensitive and could theoretically come in diff.
            // variations per call
            string normalizedMethodName = method.ToUpperInvariant();

            string methodKey = hub.Name + "::" + normalizedMethodName + "(" + normalizedParameterCountKeyPart + ")";

            return methodKey;
        }
    }
}
