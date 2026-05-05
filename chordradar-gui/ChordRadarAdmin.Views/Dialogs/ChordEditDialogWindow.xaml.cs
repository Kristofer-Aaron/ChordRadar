using ChordRadarAdmin.ViewModels.Chords;
using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class ChordEditDialogWindow : Window
    {
        public ChordEditDialogWindow()
        {
            InitializeComponent();
        }

        public ChordEditDialogWindow(ChordEditViewModel viewModel) : this()
        {
            DataContext = viewModel;
            viewModel.Saved += (_, __) => { DialogResult = true; Close(); };
            viewModel.Cancelled += (_, __) => { DialogResult = false; Close(); };
        }
    }
}
