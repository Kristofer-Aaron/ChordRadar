using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Chords
{
    /// <summary>
    /// ViewModel for add/edit chord dialog.
    /// </summary>
    public class ChordEditViewModel : BaseViewModel
    {
        private int _id;
        private string _notation;
        private string _tuning;
        private string _grip;
        private bool _isNew;
        private ICommand _saveCommand;
        private ICommand _cancelCommand;

        public int Id
        {
            get => _id;
            set => SetProperty(ref _id, value);
        }

        public string Notation
        {
            get => _notation;
            set => SetProperty(ref _notation, value);
        }

        public string Tuning
        {
            get => _tuning;
            set => SetProperty(ref _tuning, value);
        }

        public string Grip
        {
            get => _grip;
            set => SetProperty(ref _grip, value);
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

        public void LoadFromChord(ChordDto chord)
        {
            if (chord == null)
            {
                IsNew = true;
                Id = 0;
                Notation = string.Empty;
                Tuning = string.Empty;
                Grip = string.Empty;
            }
            else
            {
                IsNew = false;
                Id = chord.Id;
                Notation = chord.Notation;
                Tuning = chord.Tuning;
                Grip = chord.Grip;
            }

            ErrorMessage = string.Empty;
        }

        private void OnSave()
        {
            ErrorMessage = string.Empty;

            if (string.IsNullOrWhiteSpace(Notation) || string.IsNullOrWhiteSpace(Tuning) || string.IsNullOrWhiteSpace(Grip))
            {
                ErrorMessage = "All fields are required.";
                return;
            }

            if (Notation.Length > 16)
            {
                ErrorMessage = "Notation must be 16 characters or less.";
                return;
            }

            if (Tuning.Length > 8 || Grip.Length > 8)
            {
                ErrorMessage = "Tuning and Grip must be 8 characters or less.";
                return;
            }

            Saved?.Invoke(this, EventArgs.Empty);
        }

        private void OnCancel()
        {
            Cancelled?.Invoke(this, EventArgs.Empty);
        }

        public ChordDto GetChord()
        {
            return new ChordDto
            {
                Id = Id,
                Notation = Notation,
                Tuning = Tuning,
                Grip = Grip
            };
        }
    }
}
