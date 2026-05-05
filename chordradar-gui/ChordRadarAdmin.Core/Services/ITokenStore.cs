namespace ChordRadarAdmin.Core.Services
{
    public interface ITokenStore
    {
        string Token { get; set; }
        void Clear();
    }

    public class TokenStore : ITokenStore
    {
        public string Token { get; set; }

        public void Clear() => Token = null;
    }
}
