using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// An attribute the creates an LRU Cache for the hub method and specifies
    /// what parameters to use to create the keys to that cache.
    /// </summary>
    [AttributeUsage(
        AttributeTargets.Method,
        AllowMultiple = false)]
    public sealed class HubCacheAttribute : Attribute
    {
        /// <summary>
        /// The Cache
        /// </summary>
        public LRUCache<string,object> Cache;

        /// <summary>
        /// Creates a new LRU Cache for a Hub's method.
        /// </summary>
        /// <param name="CacheMethod">
        /// How to construct the key for the cache.
        /// </param>
        /// <param name="Capacity">The number of items in the cache</param>
        /// <param name="Hours">The number of hours in the TTL</param>
        /// <param name="Minutes">The number of minutes in the TTL</param>
        /// <param name="Seconds">The number of seconds in the TTL</param>
        /// <param name="StateKey">The key in the hubstate to use.</param>
        public HubCacheAttribute(
            CacheMethod CacheMethod = 
                CacheMethod.User
                | CacheMethod.Arguments,
            int Capacity = 1000,
            int Hours = 0,
            int Minutes = 5,
            int Seconds = 0,
            string StateKey = "Username")
        {
            this.CacheMethod = CacheMethod;
            this.TimeToLive = new TimeSpan(Hours, Minutes, Seconds);
            this.StateKey = StateKey;
            Cache = new LRUCache<string, object>(
                Capacity, Hours, Minutes, Seconds);
        }

        /// <summary>
        /// The bitmask of information to use for constructing the cache key.
        /// </summary>
        public CacheMethod CacheMethod { get; set; }

        /// <summary>
        /// The time to live of the cache.
        /// </summary>
        public TimeSpan TimeToLive { get; set; }

        /// <summary>
        /// The key in the hub state to use for constructing the cache key.
        /// </summary>
        public string StateKey { get; set; }

        /// <summary>
        /// Gets or sets a callback delegate which returns a list of strings to be
        ///     used as the cache key
        /// </summary>
        public CacheKeyDel KeyDel { get; set; }

        /// <summary>
        /// Delegate for getting a list of strings from function parameters
        /// </summary>
        /// <param name="args">Some number of objects</param>
        /// <returns>A list of strings</returns>
        public delegate List<string> CacheKeyDel(params object[] args);
    }

    /// <summary>
    /// Methods of constructing the cache key.
    /// </summary>
    [Flags]
    public enum CacheMethod
    {
        /// <summary>
        /// Don't cache
        /// </summary>
        None = 0x00,

        /// <summary>
        /// The User's IP address
        /// </summary>
        IP = 0x01,

        /// <summary>
        /// The User's UserAgent
        /// </summary>
        UserAgent = 0x02,

        /// <summary>
        /// The User's Authenticated Username
        /// </summary>
        User = 0x04,

        /// <summary>
        /// The User's unique connection ID
        /// </summary>
        ConnectionId = 0x08,

        /// <summary>
        /// The arguments to the method
        /// </summary>
        Arguments = 0x10,

        /// <summary>
        /// The value in the specified StateKey
        /// </summary>
        StateKey = 0x20,

        /// <summary>
        /// Cache key is determined by a callback delegate
        /// </summary>
        Callback = 0x40,

        /// <summary>
        /// All methods
        /// </summary>
        All = 0xFF
    }
}
