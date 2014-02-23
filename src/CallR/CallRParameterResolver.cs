using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CallRParameterResolver : DefaultParameterResolver
    {
        public override IList<object> ResolveMethodParameters(MethodDescriptor method,
            IList<IJsonValue> values)
        {
            if (method == null)
            {
                throw new ArgumentNullException("method");
            }

            if (method.Parameters.Count == values.Count)
            {
                return method
                    .Parameters
                    .Zip(values, ResolveParameter)
                    .ToArray();
            }
            else if (method.Parameters.Count > values.Count
                || method.Parameters.Count < values.Count - 1)
            {
                throw new ArgumentException("Incorrect number of arguments");
            }

            // Add special parameter to parameters
            var parameters = method.Parameters.ToList();
            parameters.Add(new ParameterDescriptor
            {
                ParameterType = typeof(string[])
            });

            return parameters.Zip(values, ResolveParameter).ToList();
        }
    }
}
