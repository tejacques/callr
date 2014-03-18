using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// The SignalR ParameterResolver for CallR
    /// </summary>
    public class CallRParameterResolver : DefaultParameterResolver
    {
        /// <summary>
        /// Overridden ResolveMethodParameters which adds the optional
        /// parameters to the HubMethod call if they do not exist.
        /// </summary>
        /// <param name="method">
        /// The method descriptor of the hub method being invoked.
        /// </param>
        /// <param name="values">The values that were passed.</param>
        /// <returns>
        /// The arguments converted to the types the method takes.
        /// </returns>
        public override IList<object> ResolveMethodParameters(
            MethodDescriptor method,
            IList<IJsonValue> values)
        {
            if (method == null)
            {
                throw new ArgumentNullException("method");
            }

            List<object> resolvedParameters;

            if (method.Parameters.Count == values.Count)
            {
                resolvedParameters = method
                    .Parameters
                    .Zip(values, ResolveParameter)
                    .ToList();
            }
            else if (method.Parameters.Count > values.Count
                || method.Parameters.Count < values.Count - 1)
            {
                throw new ArgumentException("Incorrect number of arguments");
            }
            else
            {
                // Add special parameter to parameters
                var parameters = method.Parameters.ToList();
                parameters.Add(new ParameterDescriptor
                {
                    ParameterType = typeof(CallRParams)
                });

                resolvedParameters = parameters
                    .Zip(values, ResolveParameter)
                    .ToList();
            }

            if (typeof(CallRHub).IsAssignableFrom(method.Hub.HubType))
            {
                // Get the callrParams from the resolved parameters.
                var callrParams = resolvedParameters
                    .LastOrDefault() as CallRParams;

                if (null == callrParams)
                {
                    callrParams = new CallRParams();
                    resolvedParameters.Add(callrParams);
                }

                callrParams.Params = values.ToList();

                // Remove the callrParams from the params
                if (method.Parameters.Count == values.Count - 1)
                {
                    callrParams.Params.RemoveAt(callrParams.Params.Count - 1);
                }
            }
            

            return resolvedParameters;
        }
    }
}
