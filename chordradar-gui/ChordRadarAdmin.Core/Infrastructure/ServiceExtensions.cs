using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.Core.Models;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;

namespace ChordRadarAdmin.Core.Infrastructure
{
    /// <summary>
    /// Dependency Injection configuration extensions.
    /// </summary>
    public static class ServiceExtensions
    {
        public static IServiceCollection AddCoreServices(this IServiceCollection services)
        {
            services.AddSingleton<HttpClient>(_ => new HttpClient());
            services.AddSingleton<ITokenStore, TokenStore>();
            services.AddSingleton<IApiService, ApiService>();

            // Authentication
            services.AddSingleton<IAuthService, AuthService>();

            // Entity Services
            services.AddSingleton<IChordService, ChordService>();
            services.AddSingleton<IGripService, GripService>();
            services.AddSingleton<ITuningService, TuningService>();
            services.AddSingleton<INotationService, NotationService>();
            services.AddSingleton<IUserService, UserService>();

            // Utility Services
            services.AddSingleton<IExportService, ExportService>();
            services.AddSingleton<IDialogService, DialogServicePlaceholder>();

            return services;
        }
    }

    /// <summary>
    /// Placeholder for IDialogService - will be implemented in Views project.
    /// </summary>
    public class DialogServicePlaceholder : IDialogService
    {
        public async System.Threading.Tasks.Task<bool> ShowConfirmAsync(string title, string message)
        {
            return await System.Threading.Tasks.Task.FromResult(true);
        }

        public async System.Threading.Tasks.Task ShowMessageAsync(string title, string message)
        {
            await System.Threading.Tasks.Task.CompletedTask;
        }

        public async System.Threading.Tasks.Task<ExportOptions?> ShowExportDialogAsync()
        {
            return await System.Threading.Tasks.Task.FromResult<ExportOptions?>(new ExportOptions { ExportCsv = true, ExportJson = true });
        }

        public async System.Threading.Tasks.Task<ChordDto?> ShowChordEditorAsync(ChordDto? chord)
        {
            return await System.Threading.Tasks.Task.FromResult<ChordDto?>(chord);
        }

        public async System.Threading.Tasks.Task<GripDto?> ShowGripEditorAsync(GripDto? grip)
        {
            return await System.Threading.Tasks.Task.FromResult<GripDto?>(grip);
        }

        public async System.Threading.Tasks.Task<TuningDto?> ShowTuningEditorAsync(TuningDto? tuning)
        {
            return await System.Threading.Tasks.Task.FromResult<TuningDto?>(tuning);
        }

        public async System.Threading.Tasks.Task<NotationDto?> ShowNotationEditorAsync(NotationDto? notation)
        {
            return await System.Threading.Tasks.Task.FromResult<NotationDto?>(notation);
        }

        public async System.Threading.Tasks.Task<UserDto?> ShowUserEditorAsync(UserDto? user)
        {
            return await System.Threading.Tasks.Task.FromResult<UserDto?>(user);
        }
    }
}
