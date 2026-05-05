using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using CsvHelper;
using Newtonsoft.Json;

namespace ChordRadarAdmin.Core.Services
{
    public interface IExportService
    {
        Task ExportToCsvAsync<T>(List<T> items, string filePath, List<string> columns = null);
        Task ExportToJsonAsync<T>(List<T> items, string filePath);
    }

    public class ExportService : IExportService
    {
        public async Task ExportToCsvAsync<T>(List<T> items, string filePath, List<string> columns = null)
        {
            await Task.Run(() =>
            {
                try
                {
                    using (var writer = new StreamWriter(filePath, false, Encoding.UTF8))
                    using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                    {
                        csv.WriteRecords(items);
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"CSV export failed: {ex.Message}", ex);
                }
            });
        }

        public async Task ExportToJsonAsync<T>(List<T> items, string filePath)
        {
            await Task.Run(() =>
            {
                try
                {
                    var json = JsonConvert.SerializeObject(items, Formatting.Indented);
                    File.WriteAllText(filePath, json, Encoding.UTF8);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"JSON export failed: {ex.Message}", ex);
                }
            });
        }
    }
}
