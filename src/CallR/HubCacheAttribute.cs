using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    [AttributeUsage(
        AttributeTargets.Method,
        AllowMultiple = false)]
    public sealed class HubCacheAttribute : Attribute
    {
        public ConcurrentDictionary<string,object> Cache;
        public HubCacheAttribute(
            CacheMethod CacheMethod = 
                CacheMethod.User
                | CacheMethod.Arguments,
            int Hours = 0,
            int Minutes = 5,
            int Seconds = 0,
            string StateKey = "Username")
        {
            this.CacheMethod = CacheMethod;
            this.TimeToLive = new TimeSpan(Hours, Minutes, Seconds);
            this.StateKey = StateKey;
            Cache = new ConcurrentDictionary<string, object>();
        }

        public CacheMethod CacheMethod { get; set; }

        public TimeSpan TimeToLive { get; set; }

        public string StateKey { get; set; }
    }

    [Flags]
    public enum CacheMethod
    {
        None = 0x00,
        IP = 0x01,
        UserAgent = 0x02,
        User = 0x04,
        ConnectionId = 0x08,
        Arguments = 0x10,
        StateKey = 0x20,
        All = 0xFF
    }
}
