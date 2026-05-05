using ChordRadarAdmin.ViewModels.Auth;
using System.Windows;

namespace ChordRadarAdmin.Views.Windows
{
    public partial class LoginWindow : Window
    {
        public LoginWindow()
        {
            InitializeComponent();
        }

        private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
        {
            if (DataContext is LoginViewModel vm)
            {
                vm.Password = PasswordBox.Password;
            }
        }

        public LoginWindow(LoginViewModel viewModel) :this()
        {
            DataContext = viewModel;
            PasswordBox.PasswordChanged += PasswordBox_PasswordChanged;
        }
    }
}
