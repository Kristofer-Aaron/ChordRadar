using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Tunings
{
    public class TuningListViewModel : BaseListViewModel<TuningDto>
    {
        private readonly ITuningService _tuningService;
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

        public TuningListViewModel(ITuningService tuningService, IExportService exportService, IDialogService dialogService)
        {
            _tuningService = tuningService;
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
                var tunings = await _tuningService.GetAllAsync();
                var filtered = string.IsNullOrWhiteSpace(SearchText)
                    ? tunings
                    : tunings.Where(t => t.Value.Contains(SearchText, StringComparison.OrdinalIgnoreCase)).ToList();

                Items.Clear();
                foreach (var tuning in filtered)
                    Items.Add(tuning);

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load tunings: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        protected override async Task OnSearchTextChanged() => await RefreshAsync();

        private async Task OnAddAsync()
        {
            var tuning = await _dialogService.ShowTuningEditorAsync(null);
            if (tuning != null)
            {
                await AddTuningAsync(tuning);
            }
        }

        private async Task OnEditAsync()
        {
            if (SelectedItem == null)
                return;

            var tuning = await _dialogService.ShowTuningEditorAsync(SelectedItem);
            if (tuning != null)
            {
                await UpdateTuningAsync(tuning);
            }
        }

        private async Task OnDeleteAsync()
        {
            if (SelectedItem == null)
                return;
            var confirmed = await _dialogService.ShowConfirmAsync("Delete Tuning", $"Are you sure?");
            if (!confirmed)
                return;
            try
            {
                IsBusy = true;
                await _tuningService.DeleteAsync(SelectedItem.Id);
                await RefreshAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to delete tuning: {ex.Message}";
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
                var tunings = Items.ToList();
                if (options.ExportCsv)
                    await _exportService.ExportToCsvAsync(tunings,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"tunings_{DateTime.Now:yyyyMMdd_HHmmss}.csv"));
                if (options.ExportJson)
                    await _exportService.ExportToJsonAsync(tunings,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"tunings_{DateTime.Now:yyyyMMdd_HHmmss}.json"));
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

        public async Task AddTuningAsync(TuningDto tuning)
        {
            try
            {
                IsBusy = true;
                var newTuning = await _tuningService.CreateAsync(tuning.Value);
                Items.Add(newTuning);
                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to add tuning: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }

        public async Task UpdateTuningAsync(TuningDto tuning)
        {
            try
            {
                IsBusy = true;
                var updated = await _tuningService.UpdateAsync(tuning.Id, tuning.Value);
                var index = Items.IndexOf(SelectedItem);
                if (index >= 0)
                    Items[index] = updated;

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to update tuning: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }
    }

    public class TuningEditViewModel : BaseViewModel
    {
        private int _id;
        private string _value;
        private bool _isNew;
        private ICommand _saveCommand;
        private ICommand _cancelCommand;

        public int Id { get => _id; set => SetProperty(ref _id, value); }
        public string Value { get => _value; set => SetProperty(ref _value, value); }
        public bool IsNew { get => _isNew; set => SetProperty(ref _isNew, value); }

        public ICommand SaveCommand => _saveCommand ??= new RelayCommand(_ => OnSave());
        public ICommand CancelCommand => _cancelCommand ??= new RelayCommand(_ => OnCancel());

        public event EventHandler Saved;
        public event EventHandler Cancelled;

        public void LoadFromTuning(TuningDto tuning)
        {
            if (tuning == null)
            {
                IsNew = true;
                Id = 0;
                Value = string.Empty;
            }
            else
            {
                IsNew = false;
                Id = tuning.Id;
                Value = tuning.Value;
            }
            ErrorMessage = string.Empty;
        }

        private void OnSave()
        {
            ErrorMessage = string.Empty;
            if (string.IsNullOrWhiteSpace(Value))
            {
                ErrorMessage = "Value is required.";
                return;
            }
            if (Value.Length > 8)
            {
                ErrorMessage = "Value must be 8 characters or less.";
                return;
            }
            Saved?.Invoke(this, EventArgs.Empty);
        }

        private void OnCancel() => Cancelled?.Invoke(this, EventArgs.Empty);
        public TuningDto GetTuning() => new TuningDto { Id = Id, Value = Value };
    }
}
