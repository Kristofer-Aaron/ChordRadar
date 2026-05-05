using System;

namespace ChordRadarAdmin.Core.Services
{
    public class NavigationService : INavigationService
    {
        private object _currentPage;

        public object CurrentPage => _currentPage;

        public event EventHandler PageChanged;

        public void NavigateTo(object page)
        {
            _currentPage = page;
            PageChanged?.Invoke(this, EventArgs.Empty);
        }
    }
}
