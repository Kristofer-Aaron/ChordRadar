using ChordRadarAdmin.ViewModels.Users;
using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class UserEditDialogWindow : Window
    {
        public UserEditDialogWindow()
        {
            InitializeComponent();
        }

        private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
        {
            if (DataContext is UserEditViewModel vm)
            {
                vm.Password = PasswordBox.Password;
            }
        }

        public UserEditDialogWindow(UserEditViewModel viewModel) : this()
        {
            DataContext = viewModel;
            PasswordBox.PasswordChanged += PasswordBox_PasswordChanged;
            viewModel.Saved += (_, __) => { DialogResult = true; Close(); };
            viewModel.Cancelled += (_, __) => { DialogResult = false; Close(); };
        }
    }
}
