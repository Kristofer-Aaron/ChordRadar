using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.ComponentModel;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Grips
{
    public class GripListViewModel : BaseListViewModel<GripDto>
    {
        private readonly IGripService _gripService;
        private readonly IExportService _exportService;
        private readonly IDialogService _dialogService;
        private ICommand _addCommand;
        private ICommand _editCommand;
        private ICommand _deleteCommand;
        private ICommand _exportCommand;
        private ICommand _refreshCommand;

        public ICommand AddCommand => _addCommand ??= new AsyncCommand(_ => OnAddAsync());
        public ICommand EditCommand => _editCommand ??= new AsyncCommand(_ => OnEditAsync(), _ => SelectedItem != null);
        public ICommand DeleteCommand => _deleteCommand ??= new AsyncCommand(_ => OnDeleteAsync(), _ => SelectedItem != null);
        public ICommand ExportCommand => _exportCommand ??= new AsyncCommand(_ => OnExportAsync(), _ => Items.Count > 0);
        public ICommand RefreshCommand => _refreshCommand ??= new AsyncCommand(_ => RefreshAsync());

        public GripListViewModel(IGripService gripService, IExportService exportService, IDialogService dialogService)
        {
            _gripService = gripService;
            _exportService = exportService;
            _dialogService = dialogService;

            PropertyChanged += OnViewModelPropertyChanged;
        }

        private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName != nameof(SelectedItem))
                return;

            if (_editCommand is AsyncCommand editCommand)
                editCommand.RaiseCanExecuteChanged();

            if (_deleteCommand is AsyncCommand deleteCommand)
                deleteCommand.RaiseCanExecuteChanged();
        }

        private void RaiseCollectionDependentCommandStates()
        {
            if (_exportCommand is AsyncCommand exportCommand)
                exportCommand.RaiseCanExecuteChanged();

            if (_editCommand is AsyncCommand editCommand)
                editCommand.RaiseCanExecuteChanged();

            if (_deleteCommand is AsyncCommand deleteCommand)
                deleteCommand.RaiseCanExecuteChanged();
        }

        public override async Task RefreshAsync()
        {
            try
            {
                IsBusy = true;
                ErrorMessage = string.Empty;
                var grips = await _gripService.GetAllAsync();
                var filtered = string.IsNullOrWhiteSpace(SearchText)
                    ? grips
                    : grips.Where(g => g.Strings.Contains(SearchText, StringComparison.OrdinalIgnoreCase)).ToList();

                Items.Clear();
                foreach (var grip in filtered)
                    Items.Add(grip);

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load grips: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        protected override async Task OnSearchTextChanged()
        {
            await RefreshAsync();
        }

        private async Task OnAddAsync()
        {
            var grip = await _dialogService.ShowGripEditorAsync(null);
            if (grip != null)
            {
                await AddGripAsync(grip);
            }
        }

        private async Task OnEditAsync()
        {
            if (SelectedItem == null)
                return;

            var grip = await _dialogService.ShowGripEditorAsync(SelectedItem);
            if (grip != null)
            {
                await UpdateGripAsync(grip);
            }
        }

        private async Task OnDeleteAsync()
        {
            if (SelectedItem == null)
                return;

            var confirmed = await _dialogService.ShowConfirmAsync("Delete Grip", $"Are you sure?");
            if (!confirmed)
                return;

            try
            {
                IsBusy = true;
                await _gripService.DeleteAsync(SelectedItem.Id);
                await RefreshAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to delete grip: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        private async Task OnExportAsync()
        {
            var options = await _dialogService.ShowExportDialogAsync();
            if (options == null)
                return;

            try
            {
                IsBusy = true;
                var grips = Items.ToList();
                if (options.ExportCsv)
                    await _exportService.ExportToCsvAsync(grips,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"grips_{DateTime.Now:yyyyMMdd_HHmmss}.csv"));
                if (options.ExportJson)
                    await _exportService.ExportToJsonAsync(grips,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"grips_{DateTime.Now:yyyyMMdd_HHmmss}.json"));
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Export failed: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        public async Task AddGripAsync(GripDto grip)
        {
            try
            {
                IsBusy = true;
                var newGrip = await _gripService.CreateAsync(grip.Strings);
                Items.Add(newGrip);
                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to add grip: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }

        public async Task UpdateGripAsync(GripDto grip)
        {
            try
            {
                IsBusy = true;
                var updated = await _gripService.UpdateAsync(grip.Id, grip.Strings);
                var index = Items.IndexOf(SelectedItem);
                if (index >= 0)
                    Items[index] = updated;

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to update grip: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }
    }

    public class GripEditViewModel : BaseViewModel
    {
        private int _id;
        private string _strings;
        private bool _isNew;
        private ICommand _saveCommand;
        private ICommand _cancelCommand;

        public int Id
        {
            get => _id;
            set => SetProperty(ref _id, value);
        }

        public string Strings
        {
            get => _strings;
            set => SetProperty(ref _strings, value);
        }

        public bool IsNew
        {
            get => _isNew;
            set => SetProperty(ref _isNew, value);
        }

        public ICommand SaveCommand => _saveCommand ??= new RelayCommand(_ => OnSave());
        public ICommand CancelCommand => _cancelCommand ??= new RelayCommand(_ => OnCancel());

        public event EventHandler Saved;
        public event EventHandler Cancelled;

        public void LoadFromGrip(GripDto grip)
        {
            if (grip == null)
            {
                IsNew = true;
                Id = 0;
                Strings = string.Empty;
            }
            else
            {
                IsNew = false;
                Id = grip.Id;
                Strings = grip.Strings;
            }
            ErrorMessage = string.Empty;
        }

        private void OnSave()
        {
            ErrorMessage = string.Empty;
            if (string.IsNullOrWhiteSpace(Strings))
            {
                ErrorMessage = "Strings field is required.";
                return;
            }
            if (Strings.Length > 8)
            {
                ErrorMessage = "Strings must be 8 characters or less.";
                return;
            }
            Saved?.Invoke(this, EventArgs.Empty);
        }

        private void OnCancel() => Cancelled?.Invoke(this, EventArgs.Empty);

        public GripDto GetGrip() => new GripDto { Id = Id, Strings = Strings };
    }
}
