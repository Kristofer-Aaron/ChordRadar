using System;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ChordRadarAdmin.Core.Infrastructure
{
    /// <summary>
    /// Asynchronous ICommand implementation for long-running operations.
    /// Manages IsBusy state automatically.
    /// </summary>
    public class AsyncCommand : ICommand
    {
        private readonly Func<object, Task> _execute;
        private readonly Predicate<object> _canExecute;
        private bool _isBusy;

        public bool IsBusy
        {
            get => _isBusy;
            private set
            {
                if (_isBusy != value)
                {
                    _isBusy = value;
                    CanExecuteChanged?.Invoke(this, EventArgs.Empty);
                }
            }
        }

        public event EventHandler CanExecuteChanged;

        public AsyncCommand(Func<object, Task> execute, Predicate<object> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object parameter) => !IsBusy && (_canExecute?.Invoke(parameter) ?? true);

        public async void Execute(object parameter)
        {
            if (!CanExecute(parameter))
                return;

            try
            {
                IsBusy = true;
                await _execute(parameter);
            }
            finally
            {
                IsBusy = false;
            }
        }

        public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// Asynchronous ICommand with typed parameter.
    /// </summary>
    public class AsyncCommand<T> : ICommand
    {
        private readonly Func<T, Task> _execute;
        private readonly Predicate<T> _canExecute;
        private bool _isBusy;

        public bool IsBusy
        {
            get => _isBusy;
            private set
            {
                if (_isBusy != value)
                {
                    _isBusy = value;
                    CanExecuteChanged?.Invoke(this, EventArgs.Empty);
                }
            }
        }

        public event EventHandler CanExecuteChanged;

        public AsyncCommand(Func<T, Task> execute, Predicate<T> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object parameter)
        {
            if (parameter is T t)
                return !IsBusy && (_canExecute?.Invoke(t) ?? true);
            return !IsBusy;
        }

        public async void Execute(object parameter)
        {
            if (!(parameter is T t) || !CanExecute(t))
                return;

            try
            {
                IsBusy = true;
                await _execute(t);
            }
            finally
            {
                IsBusy = false;
            }
        }

        public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}
