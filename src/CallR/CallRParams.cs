using Microsoft.AspNet.SignalR.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CallR
{
    /// <summary>
    /// The special optional parameters sent to CallR
    /// </summary>
    public class CallRParams
    {
        /// <summary>
        /// The list of Fields to filter in the result.
        /// </summary>
        public string[] Fields { get; set; }

        /// <summary>
        /// An optional timeout
        /// </summary>
        public int? Timeout { get; set; }

        /// <summary>
        /// The original params
        /// </summary>
        public IList<IJsonValue> Params { get; set; }
    }
}
