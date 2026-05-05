using System.Windows;

namespace ChordRadarAdmin.Views.Dialogs
{
    public partial class ExportDialogWindow : Window
    {
        public static readonly DependencyProperty ExportCsvProperty =
            DependencyProperty.Register(nameof(ExportCsv), typeof(bool), typeof(ExportDialogWindow), new PropertyMetadata(true));

        public static readonly DependencyProperty ExportJsonProperty =
            DependencyProperty.Register(nameof(ExportJson), typeof(bool), typeof(ExportDialogWindow), new PropertyMetadata(true));

        public bool ExportCsv
        {
            get => (bool)GetValue(ExportCsvProperty);
            set => SetValue(ExportCsvProperty, value);
        }

        public bool ExportJson
        {
            get => (bool)GetValue(ExportJsonProperty);
            set => SetValue(ExportJsonProperty, value);
        }

        public ExportDialogWindow()
        {
            InitializeComponent();
        }

        private void Ok_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
