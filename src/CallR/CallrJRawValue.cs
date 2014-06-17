// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.AspNet.SignalR.Json;
using Microsoft.AspNet.SignalR;

namespace CallR
{
    /// <summary>
    /// An implementation of IJsonValue over JSON.NET
    /// </summary>
    internal class CallRJRawValue : IJsonValue
    {
        private readonly string _value;

        public CallRJRawValue(JRaw value)
        {
            _value = value.ToString();
        }

        public object ConvertTo(Type type)
        {
            // A non generic implementation of ToObject<T> on JToken
            using (var jsonReader = new StringReader(_value))
            {
                var serializer = GlobalHost
                    .DependencyResolver.Resolve<JsonSerializer>();
                return serializer.Deserialize(jsonReader, type);
            }
        }

        public bool CanConvertTo(Type type)
        {
            // TODO: Implement when we implement better method overload resolution
            return true;
        }
    }
}