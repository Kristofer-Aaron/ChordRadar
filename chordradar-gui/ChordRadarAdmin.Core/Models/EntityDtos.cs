using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ChordRadarAdmin.Core.Models
{
    public class ChordDto
    {
        public int Id { get; set; }
        public string Notation { get; set; }
        public string Tuning { get; set; }
        public string Grip { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class GripDto
    {
        public int Id { get; set; }
        public string Strings { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class TuningDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class NotationDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UserDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("user_name")]
        public string UserName { get; set; }

        [JsonProperty("first_name")]
        public string FirstName { get; set; }

        [JsonProperty("last_name")]
        public string LastName { get; set; }

        [JsonProperty("email_address")]
        public string EmailAddress { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }

        [JsonProperty("role")]
        public string Role { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("email_verified")]
        public bool EmailVerified { get; set; }

        [JsonProperty("two_factor_enabled")]
        public bool TwoFactorEnabled { get; set; }

        [JsonProperty("two_factor_method")]
        public string TwoFactorMethod { get; set; }

        [JsonProperty("password_changed_at")]
        public DateTime? PasswordChangedAt { get; set; }

        [JsonProperty("account_created_at")]
        public DateTime? AccountCreatedAt { get; set; }

        [JsonProperty("last_login_at")]
        public DateTime? LastLoginAt { get; set; }

        [JsonProperty("preferences")]
        public JToken Preferences { get; set; }

        [JsonProperty("access_tokens")]
        public JToken AccessTokens { get; set; }

        [JsonIgnore]
        public string PreferencesDisplay => Preferences?.ToString(Formatting.Indented) ?? string.Empty;

        [JsonIgnore]
        public string AccessTokensDisplay => AccessTokens?.ToString(Formatting.Indented) ?? string.Empty;
    }

    public class UserTokenCountDto
    {
        public int UserId { get; set; }
        public int ActiveAccessTokenCount { get; set; }
        public int RefreshTokenCount { get; set; }
    }
}
