using ChordRadarAdmin.ViewModels.Notations;
using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class NotationEditDialogWindow : Window
    {
        public NotationEditDialogWindow()
        {
            InitializeComponent();
        }

        public NotationEditDialogWindow(NotationEditViewModel viewModel) : this()
        {
            DataContext = viewModel;
            viewModel.Saved += (_, __) => { DialogResult = true; Close(); };
            viewModel.Cancelled += (_, __) => { DialogResult = false; Close(); };
        }
    }
}
