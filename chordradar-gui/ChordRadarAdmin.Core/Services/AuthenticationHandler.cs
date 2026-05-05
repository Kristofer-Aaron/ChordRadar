using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    /// <summary>
    /// DelegatingHandler that injects Bearer token on every API request.
    /// Communicates with IAuthService to get the current token.
    /// </summary>
    public class AuthenticationHandler : DelegatingHandler
    {
        private readonly IAuthService _authService;

        public AuthenticationHandler(IAuthService authService)
        {
            _authService = authService;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (_authService.IsAuthenticated && !string.IsNullOrEmpty(_authService.Token))
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Bearer",
                    _authService.Token
                );
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}
