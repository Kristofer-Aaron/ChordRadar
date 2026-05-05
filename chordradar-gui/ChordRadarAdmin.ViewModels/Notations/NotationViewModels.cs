using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Notations
{
    public class NotationListViewModel : BaseListViewModel<NotationDto>
    {
        private readonly INotationService _notationService;
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

        public NotationListViewModel(INotationService notationService, IExportService exportService, IDialogService dialogService)
        {
            _notationService = notationService;
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
                var notations = await _notationService.GetAllAsync();
                var filtered = string.IsNullOrWhiteSpace(SearchText)
                    ? notations
                    : notations.Where(n => n.Value.Contains(SearchText, StringComparison.OrdinalIgnoreCase)).ToList();

                Items.Clear();
                foreach (var notation in filtered)
                    Items.Add(notation);

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load notations: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        protected override async Task OnSearchTextChanged() => await RefreshAsync();

        private async Task OnAddAsync()
        {
            var notation = await _dialogService.ShowNotationEditorAsync(null);
            if (notation != null)
            {
                await AddNotationAsync(notation);
            }
        }

        private async Task OnEditAsync()
        {
            if (SelectedItem == null)
                return;

            var notation = await _dialogService.ShowNotationEditorAsync(SelectedItem);
            if (notation != null)
            {
                await UpdateNotationAsync(notation);
            }
        }

        private async Task OnDeleteAsync()
        {
            if (SelectedItem == null)
                return;
            var confirmed = await _dialogService.ShowConfirmAsync("Delete Notation", $"Are you sure?");
            if (!confirmed)
                return;
            try
            {
                IsBusy = true;
                await _notationService.DeleteAsync(SelectedItem.Id);
                await RefreshAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to delete notation: {ex.Message}";
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
                var notations = Items.ToList();
                if (options.ExportCsv)
                    await _exportService.ExportToCsvAsync(notations,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"notations_{DateTime.Now:yyyyMMdd_HHmmss}.csv"));
                if (options.ExportJson)
                    await _exportService.ExportToJsonAsync(notations,
                        System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                            $"notations_{DateTime.Now:yyyyMMdd_HHmmss}.json"));
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

        public async Task AddNotationAsync(NotationDto notation)
        {
            try
            {
                IsBusy = true;
                var newNotation = await _notationService.CreateAsync(notation.Value);
                Items.Add(newNotation);
                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to add notation: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }

        public async Task UpdateNotationAsync(NotationDto notation)
        {
            try
            {
                IsBusy = true;
                var updated = await _notationService.UpdateAsync(notation.Id, notation.Value);
                var index = Items.IndexOf(SelectedItem);
                if (index >= 0)
                    Items[index] = updated;

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to update notation: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }
    }

    public class NotationEditViewModel : BaseViewModel
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

        public void LoadFromNotation(NotationDto notation)
        {
            if (notation == null)
            {
                IsNew = true;
                Id = 0;
                Value = string.Empty;
            }
            else
            {
                IsNew = false;
                Id = notation.Id;
                Value = notation.Value;
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
            if (Value.Length > 16)
            {
                ErrorMessage = "Value must be 16 characters or less.";
                return;
            }
            Saved?.Invoke(this, EventArgs.Empty);
        }

        private void OnCancel() => Cancelled?.Invoke(this, EventArgs.Empty);
        public NotationDto GetNotation() => new NotationDto { Id = Id, Value = Value };
    }
}
