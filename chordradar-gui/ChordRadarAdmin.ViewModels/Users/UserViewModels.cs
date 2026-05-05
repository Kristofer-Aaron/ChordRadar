using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Models;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Base;
using System;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.ViewModels.Users
{
    public class UserListViewModel : BaseListViewModel<UserDto>
    {
        private readonly IUserService _userService;
        private readonly IExportService _exportService;
        private readonly IDialogService _dialogService;
        private ICommand _addCommand;
        private ICommand _editCommand;
        private ICommand _viewDetailsCommand;
        private ICommand _deleteCommand;
        private ICommand _refreshCommand;

        public ICommand AddCommand => _addCommand ??= new AsyncCommand(_ => OnAddAsync());
        public ICommand EditCommand => _editCommand ??= new AsyncCommand(_ => OnEditAsync(), _ => SelectedItem != null);
        public ICommand ViewDetailsCommand => _viewDetailsCommand ??= new RelayCommand(_ => OnViewDetails(), _ => SelectedItem != null);
        public ICommand DeleteCommand => _deleteCommand ??= new AsyncCommand(_ => OnDeleteAsync(), _ => SelectedItem != null);
        public ICommand RefreshCommand => _refreshCommand ??= new AsyncCommand(_ => RefreshAsync());

        public event EventHandler RequestDetailsView;

        public UserListViewModel(IUserService userService, IExportService exportService, IDialogService dialogService)
        {
            _userService = userService;
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

            if (_viewDetailsCommand is RelayCommand viewDetailsCommand)
                viewDetailsCommand.RaiseCanExecuteChanged();
        }

        private async Task OnAddAsync()
        {
            var user = await _dialogService.ShowUserEditorAsync(null);
            if (user != null)
            {
                await _userService.CreateAsync(user);
                await RefreshAsync();
            }
        }

        private async Task OnEditAsync()
        {
            if (SelectedItem == null)
                return;

            var user = await _dialogService.ShowUserEditorAsync(SelectedItem);
            if (user != null)
            {
                await _userService.UpdateAsync(user.Id, user);
                await RefreshAsync();
            }
        }

        public override async Task RefreshAsync()
        {
            try
            {
                IsBusy = true;
                ErrorMessage = string.Empty;
                var users = await _userService.GetAllAsync();
                var filtered = string.IsNullOrWhiteSpace(SearchText)
                    ? users
                    : users.Where(u =>
                        u.UserName.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                        u.EmailAddress.Contains(SearchText, StringComparison.OrdinalIgnoreCase)
                    ).ToList();

                Items.Clear();
                foreach (var user in filtered)
                    Items.Add(user);
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load users: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        protected override async Task OnSearchTextChanged() => await RefreshAsync();

        private void OnViewDetails() => RequestDetailsView?.Invoke(this, EventArgs.Empty);

        private async Task OnDeleteAsync()
        {
            if (SelectedItem == null)
                return;
            var confirmed = await _dialogService.ShowConfirmAsync("Delete User", $"Delete user '{SelectedItem.UserName}'?");
            if (!confirmed)
                return;
            try
            {
                IsBusy = true;
                await _userService.DeleteAsync(SelectedItem.Id);
                await RefreshAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to delete user: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }
    }

    public class UserDetailViewModel : BaseViewModel
    {
        private readonly IUserService _userService;
        private UserDto _user;
        private int _accessTokenCount;
        private int _refreshTokenCount;
        private ICommand _backCommand;
        private ICommand _editCommand;
        private ICommand _deleteCommand;

        public UserDto User
        {
            get => _user;
            set => SetProperty(ref _user, value);
        }

        public int AccessTokenCount
        {
            get => _accessTokenCount;
            set => SetProperty(ref _accessTokenCount, value);
        }

        public int RefreshTokenCount
        {
            get => _refreshTokenCount;
            set => SetProperty(ref _refreshTokenCount, value);
        }

        public ICommand BackCommand => _backCommand ??= new RelayCommand(_ => OnBack());
        public ICommand EditCommand => _editCommand ??= new RelayCommand(_ => OnEdit(), _ => User != null);
        public ICommand DeleteCommand => _deleteCommand ??= new RelayCommand(_ => OnDelete(), _ => User != null);

        public event EventHandler GoBack;
        public event EventHandler EditRequested;
        public event EventHandler DeleteRequested;

        public UserDetailViewModel(IUserService userService)
        {
            _userService = userService;
        }

        public async Task LoadUserAsync(int userId)
        {
            try
            {
                IsBusy = true;
                ErrorMessage = string.Empty;
                User = await _userService.GetByIdAsync(userId);
                
                // TODO: Load token counts from API when available
                AccessTokenCount = 0;
                RefreshTokenCount = 0;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Failed to load user: {ex.Message}";
            }
            finally
            {
                IsBusy = false;
            }
        }

        private void OnBack() => GoBack?.Invoke(this, EventArgs.Empty);
        private void OnEdit() => EditRequested?.Invoke(this, EventArgs.Empty);
        private void OnDelete() => DeleteRequested?.Invoke(this, EventArgs.Empty);
    }

    public class UserEditViewModel : BaseViewModel
    {
        private int _id;
        private string _userName;
        private string _firstName;
        private string _lastName;
        private string _emailAddress;
        private string _password;
        private bool _emailVerified;
        private string _role;
        private string _status;
        private bool _isNew;
        private ICommand _saveCommand;
        private ICommand _cancelCommand;

        public int Id { get => _id; set => SetProperty(ref _id, value); }
        public string UserName { get => _userName; set => SetProperty(ref _userName, value); }
        public string FirstName { get => _firstName; set => SetProperty(ref _firstName, value); }
        public string LastName { get => _lastName; set => SetProperty(ref _lastName, value); }
        public string EmailAddress { get => _emailAddress; set => SetProperty(ref _emailAddress, value); }
        public string Password { get => _password; set => SetProperty(ref _password, value); }
        public bool EmailVerified { get => _emailVerified; set => SetProperty(ref _emailVerified, value); }
        public string Role { get => _role; set => SetProperty(ref _role, value); }
        public string Status { get => _status; set => SetProperty(ref _status, value); }
        public bool IsNew { get => _isNew; set => SetProperty(ref _isNew, value); }

        public ICommand SaveCommand => _saveCommand ??= new RelayCommand(_ => OnSave());
        public ICommand CancelCommand => _cancelCommand ??= new RelayCommand(_ => OnCancel());

        public event EventHandler Saved;
        public event EventHandler Cancelled;

        public void LoadFromUser(UserDto user)
        {
            if (user == null)
            {
                IsNew = true;
                Id = 0;
                UserName = string.Empty;
                FirstName = string.Empty;
                LastName = string.Empty;
                EmailAddress = string.Empty;
                Password = string.Empty;
                EmailVerified = false;
                Role = "user";
                Status = "active";
            }
            else
            {
                IsNew = false;
                Id = user.Id;
                UserName = user.UserName;
                FirstName = user.FirstName;
                LastName = user.LastName;
                EmailAddress = user.EmailAddress;
                Password = string.Empty;
                EmailVerified = user.EmailVerified;
                Role = user.Role;
                Status = user.Status;
            }
            ErrorMessage = string.Empty;
        }

        private void OnSave()
        {
            ErrorMessage = string.Empty;
            if (string.IsNullOrWhiteSpace(UserName))
            {
                ErrorMessage = "Username is required.";
                return;
            }

            if (string.IsNullOrWhiteSpace(EmailAddress))
            {
                ErrorMessage = "Email address is required.";
                return;
            }

            if (string.IsNullOrWhiteSpace(FirstName) || string.IsNullOrWhiteSpace(LastName))
            {
                ErrorMessage = "First name and last name are required.";
                return;
            }

            if (IsNew && string.IsNullOrWhiteSpace(Password))
            {
                ErrorMessage = "Password is required for new users.";
                return;
            }

            if (string.IsNullOrWhiteSpace(Role))
            {
                Role = "user";
            }

            if (string.IsNullOrWhiteSpace(Status))
            {
                Status = "active";
            }

            Saved?.Invoke(this, EventArgs.Empty);
        }

        private void OnCancel() => Cancelled?.Invoke(this, EventArgs.Empty);

        public UserDto GetUser() => new UserDto
        {
            Id = Id,
            UserName = UserName,
            FirstName = FirstName,
            LastName = LastName,
            EmailAddress = EmailAddress,
            Password = Password,
            EmailVerified = EmailVerified,
            Role = Role,
            Status = Status
        };
    }
}
