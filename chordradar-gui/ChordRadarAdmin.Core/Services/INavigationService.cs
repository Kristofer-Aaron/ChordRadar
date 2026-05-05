using System;

namespace ChordRadarAdmin.Core.Services
{
    public interface INavigationService
    {
        object CurrentPage { get; }
        event EventHandler PageChanged;
        
        void NavigateTo(object page);
    }
}
