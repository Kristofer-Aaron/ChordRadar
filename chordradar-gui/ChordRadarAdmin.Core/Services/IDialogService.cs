using System;
using System.Threading.Tasks;
using ChordRadarAdmin.Core.Models;

namespace ChordRadarAdmin.Core.Services
{
    public enum DialogType
    {
        Confirm,
        Message,
        Export
    }

    public class ExportOptions
    {
        public bool ExportCsv { get; set; }
        public bool ExportJson { get; set; }
    }

    public interface IDialogService
    {
        Task<bool> ShowConfirmAsync(string title, string message);
        Task ShowMessageAsync(string title, string message);
        Task<ExportOptions?> ShowExportDialogAsync();
        Task<ChordDto?> ShowChordEditorAsync(ChordDto? chord);
        Task<GripDto?> ShowGripEditorAsync(GripDto? grip);
        Task<TuningDto?> ShowTuningEditorAsync(TuningDto? tuning);
        Task<NotationDto?> ShowNotationEditorAsync(NotationDto? notation);
        Task<UserDto?> ShowUserEditorAsync(UserDto? user);
    }
}
