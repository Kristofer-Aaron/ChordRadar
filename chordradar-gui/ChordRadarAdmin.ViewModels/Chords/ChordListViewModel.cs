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

namespace ChordRadarAdmin.ViewModels.Chords
{
    /// <summary>
    /// ViewModel for the Chords list view. Handles filtering, CRUD, and export.
    /// </summary>
    public class ChordListViewModel : BaseListViewModel<ChordDto>
    {
        private readonly IChordService _chordService;
        private readonly IExportService _exportService;
        private readonly IDialogService _dialogService;
        private ICommand _addCommand;
        private ICommand _editCommand;
        private ICommand _deleteCommand;
        private ICommand _exportCommand;
        private ICommand _refreshCommand;
        private ICommand _clearFilterCommand;

        public ICommand AddCommand => _addCommand ??= new AsyncCommand(_ => OnAddAsync());
        public ICommand EditCommand => _editCommand ??= new AsyncCommand(_ => OnEditAsync(), _ => SelectedItem != null);
        public ICommand DeleteCommand => _deleteCommand ??= new AsyncCommand(_ => OnDeleteAsync(), _ => SelectedItem != null);
        public ICommand ExportCommand => _exportCommand ??= new AsyncCommand(_ => OnExportAsync(), _ => Items.Count > 0);
        public ICommand RefreshCommand => _refreshCommand ??= new AsyncCommand(_ => RefreshAsync());
        public ICommand ClearFilterCommand => _clearFilterCommand ??= new AsyncCommand(_ => ClearFilterAsync());

        public ChordListViewModel(IChordService chordService, IExportService exportService, IDialogService dialogService)
        {
            _chordService = chordService;
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

                var chords = await _chordService.GetAllAsync();
                var filtered = string.IsNullOrWhiteSpace(SearchText)
                    ? chords
                    : chords.Where(c =>
                        (c.Notation?.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        (c.Tuning?.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        (c.Grip?.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ?? false)
                    ).ToList();

                Items.Clear();
                foreach (var chord in filtered)
                    Items.Add(chord);

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load chords: {ex.Message}";
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
            var chord = await _dialogService.ShowChordEditorAsync(null);
            if (chord == null)
            {
                return;
            }

            await AddChordAsync(chord);
        }

        private async Task OnEditAsync()
        {
            if (SelectedItem == null)
                return;

            var chord = await _dialogService.ShowChordEditorAsync(SelectedItem);
            if (chord == null)
            {
                return;
            }

            await UpdateChordAsync(chord);
        }

        private async Task OnDeleteAsync()
        {
            if (SelectedItem == null)
                return;

            var confirmed = await _dialogService.ShowConfirmAsync(
                "Delete Chord",
                $"Are you sure you want to delete the chord '{SelectedItem.Notation}' ({SelectedItem.Tuning}, {SelectedItem.Grip})?"
            );

            if (!confirmed)
                return;

            try
            {
                IsBusy = true;
                ErrorMessage = string.Empty;
                await _chordService.DeleteAsync(SelectedItem.Id);
                await RefreshAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to delete chord: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        private async Task OnExportAsync()
        {
            if (Items.Count == 0)
                return;

            var options = await _dialogService.ShowExportDialogAsync();
            if (options == null)
                return;

            try
            {
                IsBusy = true;
                var chords = Items.ToList();

                if (options.ExportCsv)
                {
                    var csvPath = System.IO.Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                        $"chords_{DateTime.Now:yyyyMMdd_HHmmss}.csv"
                    );
                    await _exportService.ExportToCsvAsync(chords, csvPath);
                }

                if (options.ExportJson)
                {
                    var jsonPath = System.IO.Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                        $"chords_{DateTime.Now:yyyyMMdd_HHmmss}.json"
                    );
                    await _exportService.ExportToJsonAsync(chords, jsonPath);
                }
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

        public async Task AddChordAsync(ChordDto chord)
        {
            try
            {
                IsBusy = true;
                ErrorMessage = string.Empty;
                var newChord = await _chordService.CreateAsync(chord.Notation, chord.Tuning, chord.Grip);
                Items.Add(newChord);
                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to add chord: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }

        public async Task UpdateChordAsync(ChordDto chord)
        {
            try
            {
                if (SelectedItem == null)
                {
                    ErrorMessage = "No chord selected.";
                    return;
                }

                var notation = string.Equals(chord.Notation, SelectedItem.Notation, StringComparison.Ordinal)
                    ? null
                    : chord.Notation;
                var tuning = string.Equals(chord.Tuning, SelectedItem.Tuning, StringComparison.Ordinal)
                    ? null
                    : chord.Tuning;
                var grip = string.Equals(chord.Grip, SelectedItem.Grip, StringComparison.Ordinal)
                    ? null
                    : chord.Grip;

                if (notation == null && tuning == null && grip == null)
                {
                    ErrorMessage = "Change at least one field (notation, tuning, or grip) before saving.";
                    return;
                }

                IsBusy = true;
                ErrorMessage = string.Empty;
                var updated = await _chordService.UpdateAsync(chord.Id, notation, tuning, grip);
                var index = Items.IndexOf(SelectedItem);
                if (index >= 0)
                    Items[index] = updated;

                RaiseCollectionDependentCommandStates();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to update chord: {ex.Message}";
                throw;
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
