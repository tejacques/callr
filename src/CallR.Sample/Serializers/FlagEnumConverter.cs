namespace CallR.Sample.Serializers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using Newtonsoft.Json;

    public class FlagEnumJsonConverter : JsonConverter
    {

        public FlagEnumJsonConverter()
        {
        }

        public override bool CanConvert(Type objectType)
        {
            // The Type is an Enum and it has the Flags attribute
            var isEnum = typeof(Enum).IsAssignableFrom(objectType);

            if (!isEnum)
            {
                return false;
            }

            var hasFlags = objectType.IsDefined(typeof(FlagsAttribute), false);

            return hasFlags;
        }

        public override void WriteJson(
            JsonWriter writer,
            object value,
            JsonSerializer serializer)
        {
            var flags = EnumExtensions.GetIndividualFlags((Enum)value);
            var flagValues = flags.Select(e => Convert.ToUInt64(e));
            serializer.Serialize(writer, flagValues);
        }

        public override object ReadJson(
            JsonReader reader,
            Type objectType,
            object existingValue,
            JsonSerializer serializer)
        {
            UInt64 enumValue = 0;
            var value = reader.Value;
            bool keepGoing = false;
            do
            {
                switch (reader.TokenType)
                {
                    case JsonToken.StartArray:
                        // read array of numbers
                        keepGoing = true;
                        break;
                    case JsonToken.EndArray:
                        keepGoing = false;
                        break;
                    case JsonToken.Integer:
                        enumValue |= Convert.ToUInt64(reader.Value);
                        break;
                    case JsonToken.String:
                        enumValue |= Convert.ToUInt64(
                            Enum.Parse(objectType, (string)reader.Value));
                        break;
                    default:
                        throw new FormatException("Invalid JSON");
                }
            } while (keepGoing && reader.Read());

            return Enum.ToObject(objectType, enumValue);
        }
    }
}
