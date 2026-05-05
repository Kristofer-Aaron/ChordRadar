using ChordRadarAdmin.ViewModels.Base;
using System;

namespace ChordRadarAdmin.ViewModels
{
    public enum NotificationType
    {
        Success,
        Error,
        Info
    }

    /// <summary>
    /// ViewModel for global notifications/toasts.
    /// </summary>
    public class NotificationViewModel : BaseViewModel
    {
        private string _message;
        private NotificationType _type;
        private bool _isVisible;
        private int _duration = 3000; // milliseconds

        public string Message
        {
            get => _message;
            set => SetProperty(ref _message, value);
        }

        public NotificationType Type
        {
            get => _type;
            set => SetProperty(ref _type, value);
        }

        public bool IsVisible
        {
            get => _isVisible;
            set => SetProperty(ref _isVisible, value);
        }

        public int Duration
        {
            get => _duration;
            set => SetProperty(ref _duration, value);
        }

        public void ShowSuccess(string message, int duration = 3000)
        {
            Show(message, NotificationType.Success, duration);
        }

        public void ShowError(string message, int duration = 5000)
        {
            Show(message, NotificationType.Error, duration);
        }

        public void ShowInfo(string message, int duration = 3000)
        {
            Show(message, NotificationType.Info, duration);
        }

        private void Show(string message, NotificationType type, int duration)
        {
            Message = message;
            Type = type;
            Duration = duration;
            IsVisible = true;
        }

        public void Hide()
        {
            IsVisible = false;
        }
    }
}
