using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Auth
{
    /// <summary>
    /// ViewModel for the login screen. Handles email/password authentication.
    /// </summary>
    public class LoginViewModel : BaseViewModel
    {
        private readonly IAuthService _authService;
        private string _email;
        private string _password;
        private ICommand _loginCommand;

        public event EventHandler LoginSucceeded;

        public string Email
        {
            get => _email;
            set => SetProperty(ref _email, value);
        }

        public string Password
        {
            get => _password;
            set => SetProperty(ref _password, value);
        }

        public ICommand LoginCommand =>
            _loginCommand ??= new AsyncCommand(ExecuteLoginAsync);

        public LoginViewModel(IAuthService authService)
        {
            _authService = authService;
        }

        private async Task ExecuteLoginAsync(object parameter)
        {
            ErrorMessage = string.Empty;

            if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
            {
                ErrorMessage = "Email and password are required.";
                return;
            }

            try
            {
                IsBusy = true;
                var result = await _authService.LoginAsync(Email, Password);

                if (result)
                {
                    LoginSucceeded?.Invoke(this, EventArgs.Empty);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = ex.Message;
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
