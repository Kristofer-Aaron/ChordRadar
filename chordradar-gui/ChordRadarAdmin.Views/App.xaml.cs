using ChordRadarAdmin.Core.Infrastructure;
using ChordRadarAdmin.Core.Services;
using ChordRadarAdmin.ViewModels.Auth;
using ChordRadarAdmin.ViewModels.Chords;
using ChordRadarAdmin.ViewModels.Grips;
using ChordRadarAdmin.ViewModels.Main;
using ChordRadarAdmin.ViewModels.Notations;
using ChordRadarAdmin.ViewModels.Tunings;
using ChordRadarAdmin.ViewModels.Users;
using ChordRadarAdmin.Views.Windows;
using Microsoft.Extensions.DependencyInjection;
using SharpVectors.Converters;
using SharpVectors.Renderers.Wpf;
using System;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Media;

namespace ChordRadarAdmin.Views
{
	public partial class App : Application
	{
		private ServiceProvider? _serviceProvider;

		protected override void OnStartup(StartupEventArgs e)
		{
			base.OnStartup(e);

			var services = new ServiceCollection();
			ConfigureServices(services);
			_serviceProvider = services.BuildServiceProvider();
			InitializeAppIcon();

			DispatcherUnhandledException += (_, args) =>
			{
				MessageBox.Show(args.Exception.Message, "Unexpected Error", MessageBoxButton.OK, MessageBoxImage.Error);
				args.Handled = true;
			};

			ShowLogin();
		}

		private void ConfigureServices(ServiceCollection services)
		{
			services.AddCoreServices();
			services.AddSingleton<INavigationService, NavigationService>();
			services.AddSingleton<IDialogService, ChordRadarAdmin.Views.Services.DialogService>();

			services.AddTransient<LoginViewModel>();
			services.AddTransient<ChordListViewModel>();
			services.AddTransient<GripListViewModel>();
			services.AddTransient<TuningListViewModel>();
			services.AddTransient<NotationListViewModel>();
			services.AddTransient<UserListViewModel>();
			services.AddTransient<MainWindowViewModel>();

			services.AddTransient<LoginWindow>();
			services.AddTransient<MainWindow>();
		}

		private void ShowLogin()
		{
			var services = _serviceProvider ?? throw new InvalidOperationException("Service provider not initialized.");
			var loginViewModel = services.GetRequiredService<LoginViewModel>();
			var loginWindow = new LoginWindow(loginViewModel);

			loginViewModel.LoginSucceeded += (_, __) =>
			{
				ShowMainWindow();
				loginWindow.Dispatcher.BeginInvoke(new Action(() => loginWindow.Close()));
			};

			loginWindow.Closed += (_, __) =>
			{
				if (Current.MainWindow == loginWindow)
				{
					Current.Shutdown();
				}
			};

			MainWindow = loginWindow;
			loginWindow.Show();
		}

		private void ShowMainWindow()
		{
			var services = _serviceProvider ?? throw new InvalidOperationException("Service provider not initialized.");
			var mainWindowViewModel = services.GetRequiredService<MainWindowViewModel>();
			var mainWindow = new MainWindow(mainWindowViewModel);
			mainWindowViewModel.RequestClose += (_, __) =>
			{
				mainWindow.Close();
				ShowLogin();
			};

			MainWindow = mainWindow;
			mainWindow.Show();
		}

		public void SwitchTheme(string theme)
		{
			var dictionaries = Resources.MergedDictionaries;
			var existingTheme = dictionaries.FirstOrDefault(d => d.Source != null && d.Source.OriginalString.Contains("Themes/Light.xaml"))
								?? dictionaries.FirstOrDefault(d => d.Source != null && d.Source.OriginalString.Contains("Themes/Dark.xaml"));

			if (existingTheme != null)
				dictionaries.Remove(existingTheme);

			dictionaries.Add(new ResourceDictionary
			{
				Source = new Uri($"Themes/{theme}.xaml", UriKind.Relative)
			});
		}

		private void InitializeAppIcon()
		{
			var svgPath = Path.Combine(AppContext.BaseDirectory, "Assets", "chordradar.svg");
			if (!File.Exists(svgPath))
				return;

			var settings = new WpfDrawingSettings();
			var reader = new FileSvgReader(settings);
			var drawing = reader.Read(svgPath);

			if (drawing == null)
				return;

			drawing.Freeze();
			Resources["AppIcon"] = new DrawingImage(drawing);
		}
	}
}

