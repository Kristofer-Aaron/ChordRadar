using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using ChordRadarAdmin.ViewModels.Chords;
using ChordRadarAdmin.ViewModels.Grips;
using ChordRadarAdmin.ViewModels.Notations;
using ChordRadarAdmin.ViewModels.Tunings;
using ChordRadarAdmin.ViewModels.Users;
using System;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Main
{
    /// <summary>
    /// ViewModel for the main admin window. Manages navigation and theme switching.
    /// </summary>
    public class MainWindowViewModel : BaseViewModel
    {
        private readonly IAuthService _authService;
        private readonly INavigationService _navigationService;
        private BaseViewModel _currentPage;
        private string _currentTheme = "Light";
        private ICommand _navigateChordsCommand;
        private ICommand _navigateGripsCommand;
        private ICommand _navigateTuningsCommand;
        private ICommand _navigateNotationsCommand;
        private ICommand _navigateUsersCommand;
        private ICommand _toggleThemeCommand;
        private ICommand _logoutCommand;
        private readonly ChordListViewModel _chordListViewModel;
        private readonly GripListViewModel _gripListViewModel;
        private readonly TuningListViewModel _tuningListViewModel;
        private readonly NotationListViewModel _notationListViewModel;
        private readonly UserListViewModel _userListViewModel;

        public BaseViewModel CurrentPage
        {
            get => _currentPage;
            set => SetProperty(ref _currentPage, value);
        }

        public string CurrentTheme
        {
            get => _currentTheme;
            set => SetProperty(ref _currentTheme, value);
        }

        public ICommand NavigateChordsCommand => _navigateChordsCommand ??= new RelayCommand(_ => NavigateToChords());
        public ICommand NavigateGripsCommand => _navigateGripsCommand ??= new RelayCommand(_ => NavigateToGrips());
        public ICommand NavigateTuningsCommand => _navigateTuningsCommand ??= new RelayCommand(_ => NavigateToTunings());
        public ICommand NavigateNotationsCommand => _navigateNotationsCommand ??= new RelayCommand(_ => NavigateToNotations());
        public ICommand NavigateUsersCommand => _navigateUsersCommand ??= new RelayCommand(_ => NavigateToUsers());
        public ICommand ToggleThemeCommand => _toggleThemeCommand ??= new RelayCommand(_ => ToggleTheme());
        public ICommand LogoutCommand => _logoutCommand ??= new AsyncCommand(_ => OnLogoutAsync());

        public event EventHandler RequestClose;
        public event EventHandler<string> ThemeChanged;

        public MainWindowViewModel(
            IAuthService authService,
            INavigationService navigationService,
            ChordListViewModel chordListViewModel,
            GripListViewModel gripListViewModel,
            TuningListViewModel tuningListViewModel,
            NotationListViewModel notationListViewModel,
            UserListViewModel userListViewModel
        )
        {
            _authService = authService;
            _navigationService = navigationService;
            _chordListViewModel = chordListViewModel;
            _gripListViewModel = gripListViewModel;
            _tuningListViewModel = tuningListViewModel;
            _notationListViewModel = notationListViewModel;
            _userListViewModel = userListViewModel;

            NavigateToChords();
        }

        private void NavigateToChords()
        {
            CurrentPage = _chordListViewModel;
            _navigationService.NavigateTo(CurrentPage);
            _ = RefreshCurrentPageAsync();
        }

        private void NavigateToGrips()
        {
            CurrentPage = _gripListViewModel;
            _navigationService.NavigateTo(CurrentPage);
            _ = RefreshCurrentPageAsync();
        }

        private void NavigateToTunings()
        {
            CurrentPage = _tuningListViewModel;
            _navigationService.NavigateTo(CurrentPage);
            _ = RefreshCurrentPageAsync();
        }

        private void NavigateToNotations()
        {
            CurrentPage = _notationListViewModel;
            _navigationService.NavigateTo(CurrentPage);
            _ = RefreshCurrentPageAsync();
        }

        private void NavigateToUsers()
        {
            CurrentPage = _userListViewModel;
            _navigationService.NavigateTo(CurrentPage);
            _ = RefreshCurrentPageAsync();
        }

        private async System.Threading.Tasks.Task RefreshCurrentPageAsync()
        {
            try
            {
                switch (CurrentPage)
                {
                    case ChordListViewModel chords:
                        await chords.RefreshAsync();
                        break;
                    case GripListViewModel grips:
                        await grips.RefreshAsync();
                        break;
                    case TuningListViewModel tunings:
                        await tunings.RefreshAsync();
                        break;
                    case NotationListViewModel notations:
                        await notations.RefreshAsync();
                        break;
                    case UserListViewModel users:
                        await users.RefreshAsync();
                        break;
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load page data: {ex.Message}";
            }
        }

        private void ToggleTheme()
        {
            CurrentTheme = CurrentTheme == "Light" ? "Dark" : "Light";
            ThemeChanged?.Invoke(this, CurrentTheme);
        }

        private async System.Threading.Tasks.Task OnLogoutAsync()
        {
            try
            {
                IsBusy = true;
                await _authService.LogoutAsync();
                RequestClose?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Logout failed: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
