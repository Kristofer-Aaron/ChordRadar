using ChordRadarAdmin.Core.Models;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    /// <summary>
    /// Authentication service interface for login, logout, and token management.
    /// </summary>
    public interface IAuthService
    {
        bool IsAuthenticated { get; }
        string Token { get; }
        UserDto CurrentUser { get; }

        Task<bool> LoginAsync(string email, string password);
        Task LogoutAsync();
    }
}
