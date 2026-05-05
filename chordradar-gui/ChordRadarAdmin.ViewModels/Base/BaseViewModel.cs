using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ChordRadarAdmin.ViewModels.Base
{
    /// <summary>
    /// Base class for all ViewModels implementing INotifyPropertyChanged.
    /// Provides property change notification and common ViewModel lifecycle hooks.
    /// </summary>
    public abstract class BaseViewModel : INotifyPropertyChanged
    {
        private bool _isBusy;
        private string _errorMessage;

        public event PropertyChangedEventHandler PropertyChanged;

        public bool IsBusy
        {
            get => _isBusy;
            set => SetProperty(ref _isBusy, value);
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        /// <summary>
        /// Called when the ViewModel is navigated to. Override in derived classes.
        /// </summary>
        public virtual void OnNavigatedTo() { }

        /// <summary>
        /// Called when the ViewModel is navigated away from. Override in derived classes.
        /// </summary>
        public virtual void OnNavigatedFrom() { }

        /// <summary>
        /// Helper method to set property values and raise PropertyChanged event.
        /// </summary>
        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (Equals(field, value))
                return false;

            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }

        /// <summary>
        /// Raises PropertyChanged event.
        /// </summary>
        protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
