using ChordRadarAdmin.ViewModels.Main;
using System.Windows;

namespace ChordRadarAdmin.Views.Windows
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        public MainWindow(MainWindowViewModel viewModel) : this()
        {
            DataContext = viewModel;
            viewModel.RequestClose += (s, e) => Close();
            viewModel.ThemeChanged += (s, theme) => ((App)Application.Current).SwitchTheme(theme);
        }
    }
}
