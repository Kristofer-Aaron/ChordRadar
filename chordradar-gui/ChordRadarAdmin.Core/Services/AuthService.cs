using ChordRadarAdmin.Core.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    /// <summary>
    /// Implementation of IAuthService. Manages login, logout, and token storage.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IApiService _apiService;
        private readonly ITokenStore _tokenStore;
        private string _token;
        private UserDto _currentUser;

        public bool IsAuthenticated => !string.IsNullOrEmpty(_token);
        public string Token => _token;
        public UserDto CurrentUser => _currentUser;

        public AuthService(IApiService apiService, ITokenStore tokenStore)
        {
            _apiService = apiService;
            _tokenStore = tokenStore;
        }

        public async Task<bool> LoginAsync(string email, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                    throw new ArgumentException("Email and password are required");

                var request = new AuthLoginRequest
                {
                    EmailAddress = email,
                    Password = password
                };

                var response = await _apiService.PostAsync<AuthLoginResponse>("/auth/login/gui", request);

                if (!response.Ok || string.IsNullOrEmpty(response.Token))
                    throw new InvalidOperationException("Login failed: No token received");

                _token = response.Token;
                _tokenStore.Token = _token;
                _currentUser = ParseTokenToUser(_token);

                return true;
            }
            catch (Exception ex)
            {
                _token = null;
                _tokenStore.Clear();
                _currentUser = null;
                throw new InvalidOperationException($"Login failed: {ex.Message}", ex);
            }
        }

        public async Task LogoutAsync()
        {
            try
            {
                if (IsAuthenticated)
                {
                    // Call logout endpoint to invalidate token on server
                    try
                    {
                        await _apiService.PostAsync<dynamic>("/auth/logout", new { });
                    }
                    catch
                    {
                        // Silently fail - we'll clear local token anyway
                    }
                }
            }
            finally
            {
                _token = null;
                _tokenStore.Clear();
                _currentUser = null;
            }
        }

        /// <summary>
        /// Parses JWT token to extract user info (sub, role).
        /// </summary>
        private UserDto ParseTokenToUser(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadToken(token) as JwtSecurityToken;

                if (jwtToken == null)
                    throw new InvalidOperationException("Invalid token format");

                var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                    ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "id")?.Value
                    ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value
                    ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

                var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "role")?.Value
                    ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

                if (int.TryParse(idClaim, out var userId))
                {
                    return new UserDto
                    {
                        Id = userId,
                        Role = roleClaim ?? "user"
                    };
                }

                throw new InvalidOperationException("Token missing required claims");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to parse token: {ex.Message}", ex);
            }
        }
    }
}
