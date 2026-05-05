using Microsoft.Extensions.Logging;
using System;

namespace ChordRadarAdmin.Core.Infrastructure
{
    /// <summary>
    /// Simple logger abstraction wrapping Microsoft.Extensions.Logging.ILogger.
    /// Can be extended for custom logging strategies.
    /// </summary>
    public class LoggerBase
    {
        private readonly ILogger _logger;

        public LoggerBase(ILogger logger)
        {
            _logger = logger;
        }

        public void LogTrace(string message) => _logger?.LogTrace(message);
        public void LogDebug(string message) => _logger?.LogDebug(message);
        public void LogInformation(string message) => _logger?.LogInformation(message);
        public void LogWarning(string message) => _logger?.LogWarning(message);
        public void LogError(string message, Exception ex = null) => _logger?.LogError(ex, message);

        public void LogTrace(string message, params object[] args) => _logger?.LogTrace(message, args);
        public void LogDebug(string message, params object[] args) => _logger?.LogDebug(message, args);
        public void LogInformation(string message, params object[] args) => _logger?.LogInformation(message, args);
        public void LogWarning(string message, params object[] args) => _logger?.LogWarning(message, args);
        public void LogError(string message, Exception ex, params object[] args) => _logger?.LogError(ex, message, args);
    }
}
