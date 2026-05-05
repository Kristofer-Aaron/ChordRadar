using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    /// <summary>
    /// Main API service interface. Provides methods for all HTTP operations.
    /// </summary>
    public interface IApiService
    {
        string BaseUrl { get; set; }

        Task<T> GetAsync<T>(string endpoint);
        Task<T> PostAsync<T>(string endpoint, object body);
        Task<T> PutAsync<T>(string endpoint, object body);
        Task<T> PatchAsync<T>(string endpoint, object body);
        Task DeleteAsync(string endpoint);
    }
}
