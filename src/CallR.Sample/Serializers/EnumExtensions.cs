namespace CallR.Sample.Serializers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    public static class EnumExtensions
    {
        // NOTE: Generic type constraints cannot currently be Enum in C#
        // struct, IComparable, IFormattable, IConvertible is used as a proxy

        /// <summary>
        /// Adapted from http://hugoware.net/blog/enumeration-extensions-2-0
        /// Under the Creative Commons license
        /// </summary>
        public static TEnum AddFlag<TEnum>(this Enum e, TEnum flag)
            where TEnum : struct, IComparable, IFormattable, IConvertible
        {
            try
            {
                return (TEnum)(object)
                    (Convert.ToInt64(e) | Convert.ToInt64(flag));
            }
            catch (Exception ex)
            {
                throw new ArgumentException(
                    string.Format(
                        "Could not add flag from enumerated type '{0}'.",
                        typeof(TEnum).Name
                        ), ex);
            }
        }

        /// <summary>
        /// Adapted from http://hugoware.net/blog/enumeration-extensions-2-0
        /// Under the Creative Commons license
        /// </summary>
        public static TEnum RemoveFlag<TEnum>(this Enum e, TEnum flag)
            where TEnum : struct, IComparable, IFormattable, IConvertible
        {
            try
            {
                return (TEnum)(object)
                    (Convert.ToInt64(e) & ~Convert.ToInt64(flag));
            }
            catch (Exception ex)
            {
                throw new ArgumentException(
                    string.Format(
                        "Could not remove flag from enumerated type '{0}'.",
                        typeof(TEnum).Name
                        ), ex);
            }
        }

        public static IEnumerable<Enum> GetFlags(this Enum value)
        {
            return GetFlags(value, Enum.GetValues(value.GetType())
                .Cast<Enum>()
                .ToArray());
        }

        public static IEnumerable<Enum> GetIndividualFlags(this Enum value)
        {
            return GetFlags(value, GetFlagValues(value.GetType()).ToArray());
        }

        private static IEnumerable<Enum> GetFlags(Enum value, Enum[] values)
        {
            ulong bits = Convert.ToUInt64(value);
            List<Enum> results = new List<Enum>();
            for (int i = values.Length - 1; i >= 0; i--)
            {
                ulong mask = Convert.ToUInt64(values[i]);

                // Don't include the flag representing 0 in the results here
                // We'll include it if the Enum value is 0, and there are valid
                // flags, and one of those flags is 0
                if (0 == i && 0L == mask)
                {
                    break;
                }

                if ((bits & mask) == mask)
                {
                    results.Add(values[i]);
                    bits -= mask;
                }
            }

            if (bits != 0L)
            {
                return Enumerable.Empty<Enum>();
            }

            if (Convert.ToUInt64(value) != 0L)
            {
                return results.Reverse<Enum>();
            }

            if (bits == Convert.ToUInt64(value)
                && values.Length > 0
                && Convert.ToUInt64(values[0]) == 0L)
            {
                return values.Take(1);
            }

            return Enumerable.Empty<Enum>();
        }

        private static IEnumerable<Enum> GetFlagValues(Type enumType)
        {
            ulong flag = 0x1;
            foreach (var value in Enum.GetValues(enumType).Cast<Enum>())
            {
                ulong bits = Convert.ToUInt64(value);
                if (bits == 0L)
                {
                    // skip the zero value
                    continue;
                }

                while (flag < bits) flag <<= 1;

                if (flag == bits)
                {
                    yield return value;
                }
            }
        }

        public static bool HasAny<TEnum>(this Enum e, TEnum value)
            where TEnum : struct, IComparable, IFormattable, IConvertible
        {
            long eValue = Convert.ToInt64(e);
            long lValue = Convert.ToInt64(value);

            return (eValue & lValue) > 0;
        }
    }
}