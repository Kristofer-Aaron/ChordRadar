using ChordRadarAdmin.ViewModels.Grips;
using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class GripEditDialogWindow : Window
    {
        public GripEditDialogWindow()
        {
            InitializeComponent();
        }

        public GripEditDialogWindow(GripEditViewModel viewModel) : this()
        {
            DataContext = viewModel;
            viewModel.Saved += (_, __) => { DialogResult = true; Close(); };
            viewModel.Cancelled += (_, __) => { DialogResult = false; Close(); };
        }
    }
}
