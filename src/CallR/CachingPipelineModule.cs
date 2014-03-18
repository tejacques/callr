using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// A HubPipelineModule which caches results based on configurable settings
    /// </summary>
    public class CachingPipelineModule : HubPipelineModule
    {
        /// <summary>
        /// Overridden BuildIncoming function which returns without invoking
        /// early if the method if the result is in the cache.
        /// </summary>
        /// <param name="invoke">The continuation of the hub pipeline</param>
        /// <returns>The altered hub pipeline</returns>
        public override Func<IHubIncomingInvokerContext, Task<object>> 
            BuildIncoming(
                Func<IHubIncomingInvokerContext, Task<object>> invoke)
        {
            return async context =>
            {
                if (typeof(CallRHub)
                    .IsAssignableFrom(
                    context.MethodDescriptor.Hub.HubType))
                {
                    var cacheAttribute = context
                        .MethodDescriptor
                        .Attributes
                        .Where(attr =>
                            attr.GetType() == typeof(HubCacheAttribute))
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
                }

                return await base.BuildIncoming(invoke)(context);
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
                var callrHub = context.Hub as CallRHub;
                long sum = callrHub
                    .Parameters
                    .Params
                    .Select(arg => arg.ToString().GetHashCode())
                    .Sum(x => (long)x);
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
