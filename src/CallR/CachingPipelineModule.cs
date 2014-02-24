using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    public class CachingPipelineModule : HubPipelineModule
    {
        public override Func<IHubIncomingInvokerContext, Task<object>> BuildIncoming(Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return async context =>
            {
                var cacheAttribute = context
                    .MethodDescriptor
                    .Attributes
                    .Where(attr => attr.GetType() == typeof(HubCacheAttribute))
                    .FirstOrDefault() as HubCacheAttribute;

                string cacheKey = null;
                object cachedVal = null;

                cacheKey = BuildCacheKey(context, cacheAttribute);

                // Check the cache
                if (!string.IsNullOrEmpty(cacheKey))
                {
                    if (cacheAttribute
                        .Cache
                        .TryGetValue(cacheKey, out cachedVal))
                    {
                        return cachedVal;
                    }
                }

                var res = await base.BuildIncoming(invoke)(context);

                // Add to the cache
                if (!string.IsNullOrEmpty(cacheKey))
                {
                    cacheAttribute.Cache.TryAdd(cacheKey, res);
                }

                return res;
            };
        }

        private static string BuildCacheKey(
            IHubIncomingInvokerContext context,
            HubCacheAttribute cacheAttribute)
        {
            if (null == cacheAttribute)
            {
                return null;
            }

            var list = new List<string>();

            if ((cacheAttribute.CacheMethod & CacheMethod.Arguments)
                == CacheMethod.Arguments)
            {
                var sum = context.Args.Select(arg => arg.GetHashCode()).Sum();
                list.Add(sum.ToString());
            }
            if ((cacheAttribute.CacheMethod & CacheMethod.IP)
                == CacheMethod.IP)
            {
                object IP;
                if (context.Hub.Context.Request.Environment
                    .TryGetValue("server.RemoteIpAddress", out IP))
                {
                    list.Add(IP.ToString());
                }
            }
            if ((cacheAttribute.CacheMethod & CacheMethod.ConnectionId)
                == CacheMethod.ConnectionId)
            {
                list.Add(context.Hub.Context.ConnectionId);
            }
            if ((cacheAttribute.CacheMethod & CacheMethod.User)
                == CacheMethod.User)
            {
                list.Add(context.Hub.Context.User.Identity.Name);
            }
            if ((cacheAttribute.CacheMethod & CacheMethod.UserAgent)
                == CacheMethod.UserAgent)
            {
                var kvp = context
                    .Hub
                    .Context
                    .Headers
                    .FirstOrDefault(pair =>
                        pair.Key.ToLowerInvariant() == "user-agent");

                var UserAgent = kvp.Value;

                if (!string.IsNullOrEmpty(UserAgent))
                {
                    list.Add(UserAgent);
                }
            }
            if ((cacheAttribute.CacheMethod & CacheMethod.StateKey)
                 == CacheMethod.StateKey
                && !string.IsNullOrEmpty(cacheAttribute.StateKey))
            {
                var StateValue = context.StateTracker[cacheAttribute.StateKey]
                    as string;

                if (!string.IsNullOrEmpty(StateValue))
                {
                    list.Add(StateValue);
                }
            }

            return string.Join("-", list);
        }
        
    }
}
