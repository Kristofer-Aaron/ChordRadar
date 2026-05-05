using System.Collections.ObjectModel;
using System.Threading.Tasks;

namespace ChordRadarAdmin.ViewModels.Base
{
    /// <summary>
    /// Base class for list ViewModels. Provides common list functionality:
    /// - ObservableCollection for items
    /// - Search/filter text
    /// - Selected item binding
    /// </summary>
    public abstract class BaseListViewModel<T> : BaseViewModel
    {
        private ObservableCollection<T> _items;
        private T _selectedItem;
        private string _searchText;

        public ObservableCollection<T> Items
        {
            get => _items ??= new ObservableCollection<T>();
            set => SetProperty(ref _items, value);
        }

        public T SelectedItem
        {
            get => _selectedItem;
            set => SetProperty(ref _selectedItem, value);
        }

        public string SearchText
        {
            get => _searchText;
            set
            {
                if (SetProperty(ref _searchText, value))
                {
                    // Auto-refresh on filter change (optional, can be overridden)
                    _ = OnSearchTextChanged();
                }
            }
        }

        /// <summary>
        /// Override to implement custom filtering behavior.
        /// </summary>
        protected virtual Task OnSearchTextChanged()
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Abstract method to refresh the list. Must be implemented by derived classes.
        /// </summary>
        public abstract Task RefreshAsync();

        /// <summary>
        /// Clears the search text and refreshes.
        /// </summary>
        public async Task ClearFilterAsync()
        {
            SearchText = string.Empty;
            await RefreshAsync();
        }
    }
}
