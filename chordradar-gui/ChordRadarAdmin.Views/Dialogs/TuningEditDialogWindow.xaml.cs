using ChordRadarAdmin.ViewModels.Tunings;
using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class TuningEditDialogWindow : Window
    {
        public TuningEditDialogWindow()
        {
            InitializeComponent();
        }

        public TuningEditDialogWindow(TuningEditViewModel viewModel) : this()
        {
            DataContext = viewModel;
            viewModel.Saved += (_, __) => { DialogResult = true; Close(); };
            viewModel.Cancelled += (_, __) => { DialogResult = false; Close(); };
        }
    }
}
