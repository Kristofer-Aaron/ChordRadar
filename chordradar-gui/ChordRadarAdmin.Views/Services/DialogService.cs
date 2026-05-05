using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Chords;
using ChordRadarAdmin.ViewModels.Grips;
using ChordRadarAdmin.ViewModels.Notations;
using ChordRadarAdmin.ViewModels.Tunings;
using ChordRadarAdmin.ViewModels.Users;
using ChordRadarAdmin.Views.Dialogs;
using System.Windows;

namespace ChordRadarAdmin.Views.Services
{
    public class DialogService : IDialogService
    {
        public Task<bool> ShowConfirmAsync(string title, string message)
        {
            var result = MessageBox.Show(message, title, MessageBoxButton.YesNo, MessageBoxImage.Question);
            return Task.FromResult(result == MessageBoxResult.Yes);
        }

        public Task ShowMessageAsync(string title, string message)
        {
            MessageBox.Show(message, title, MessageBoxButton.OK, MessageBoxImage.Information);
            return Task.CompletedTask;
        }

        public Task<ExportOptions?> ShowExportDialogAsync()
        {
            var dialog = new ExportDialogWindow
            {
                Owner = Application.Current.MainWindow
            };

            var result = dialog.ShowDialog();
            if (result == true)
            {
                return Task.FromResult(new ExportOptions
                {
                    ExportCsv = dialog.ExportCsv,
                    ExportJson = dialog.ExportJson
                });
            }

            return Task.FromResult<ExportOptions?>(null);
        }

        public Task<ChordDto?> ShowChordEditorAsync(ChordDto? chord)
        {
            var viewModel = new ChordEditViewModel();
            viewModel.LoadFromChord(chord);

            var dialog = new ChordEditDialogWindow
            {
                Owner = Application.Current.MainWindow,
                DataContext = viewModel
            };

            ChordDto? result = null;

            viewModel.Saved += (_, __) =>
            {
                result = viewModel.GetChord();
                dialog.DialogResult = true;
                dialog.Close();
            };

            viewModel.Cancelled += (_, __) =>
            {
                dialog.DialogResult = false;
                dialog.Close();
            };

            var accepted = dialog.ShowDialog();
            return Task.FromResult<ChordDto?>(accepted == true ? result : null);
        }

        public Task<GripDto?> ShowGripEditorAsync(GripDto? grip)
        {
            var viewModel = new GripEditViewModel();
            viewModel.LoadFromGrip(grip);

            var dialog = new GripEditDialogWindow(viewModel)
            {
                Owner = Application.Current.MainWindow
            };

            GripDto? result = null;
            viewModel.Saved += (_, __) => result = viewModel.GetGrip();

            var accepted = dialog.ShowDialog();
            return Task.FromResult<GripDto?>(accepted == true ? result : null);
        }

        public Task<TuningDto?> ShowTuningEditorAsync(TuningDto? tuning)
        {
            var viewModel = new TuningEditViewModel();
            viewModel.LoadFromTuning(tuning);

            var dialog = new TuningEditDialogWindow(viewModel)
            {
                Owner = Application.Current.MainWindow
            };

            TuningDto? result = null;
            viewModel.Saved += (_, __) => result = viewModel.GetTuning();

            var accepted = dialog.ShowDialog();
            return Task.FromResult<TuningDto?>(accepted == true ? result : null);
        }

        public Task<NotationDto?> ShowNotationEditorAsync(NotationDto? notation)
        {
            var viewModel = new NotationEditViewModel();
            viewModel.LoadFromNotation(notation);

            var dialog = new NotationEditDialogWindow(viewModel)
            {
                Owner = Application.Current.MainWindow
            };

            NotationDto? result = null;
            viewModel.Saved += (_, __) => result = viewModel.GetNotation();

            var accepted = dialog.ShowDialog();
            return Task.FromResult<NotationDto?>(accepted == true ? result : null);
        }

        public Task<UserDto?> ShowUserEditorAsync(UserDto? user)
        {
            var viewModel = new UserEditViewModel();
            viewModel.LoadFromUser(user);

            var dialog = new UserEditDialogWindow(viewModel)
            {
                Owner = Application.Current.MainWindow
            };

            UserDto? result = null;
            viewModel.Saved += (_, __) => result = viewModel.GetUser();

            var accepted = dialog.ShowDialog();
            return Task.FromResult<UserDto?>(accepted == true ? result : null);
        }
    }
}
