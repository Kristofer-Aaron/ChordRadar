namespace ChordRadarAdmin.Core.Models
{
    public class AuthLoginRequest
    {
        [Newtonsoft.Json.JsonProperty("email_address")]
        public string EmailAddress { get; set; }

        [Newtonsoft.Json.JsonProperty("password")]
        public string Password { get; set; }
    }

    public class AuthLoginResponse
    {
        [Newtonsoft.Json.JsonProperty("ok")]
        public bool Ok { get; set; }

        [Newtonsoft.Json.JsonProperty("token")]
        public string Token { get; set; }

        [Newtonsoft.Json.JsonProperty("renewed")]
        public bool Renewed { get; set; }
    }
}
