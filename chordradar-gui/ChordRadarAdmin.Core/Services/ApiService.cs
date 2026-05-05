using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ChordRadarAdmin.Core.Services
{
    /// <summary>
    /// Implementation of IApiService using HttpClient.
    /// Handles JSON serialization/deserialization and error mapping.
    /// </summary>
    public class ApiService : IApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ITokenStore _tokenStore;
        private string _baseUrl = "http://192.168.1.14:3003";

        public string BaseUrl
        {
            get => _baseUrl;
            set => _baseUrl = value;
        }

        public ApiService(HttpClient httpClient, ITokenStore tokenStore)
        {
            _httpClient = httpClient;
            _tokenStore = tokenStore;
        }

        public async Task<T> GetAsync<T>(string endpoint)
        {
            try
            {
                var url = CombineUrl(endpoint);
                AddAuthorizationHeader();
                var response = await _httpClient.GetAsync(url);
                return await HandleResponse<T>(response);
            }
            catch (Exception ex)
            {
                throw new ApiException($"GET {endpoint} failed", ex);
            }
        }

        public async Task<T> PostAsync<T>(string endpoint, object body)
        {
            try
            {
                var url = CombineUrl(endpoint);
                AddAuthorizationHeader();
                var content = SerializeContent(body);
                var response = await _httpClient.PostAsync(url, content);
                return await HandleResponse<T>(response);
            }
            catch (Exception ex)
            {
                throw new ApiException($"POST {endpoint} failed", ex);
            }
        }

        public async Task<T> PutAsync<T>(string endpoint, object body)
        {
            try
            {
                var url = CombineUrl(endpoint);
                AddAuthorizationHeader();
                var content = SerializeContent(body);
                var response = await _httpClient.PutAsync(url, content);
                return await HandleResponse<T>(response);
            }
            catch (Exception ex)
            {
                throw new ApiException($"PUT {endpoint} failed", ex);
            }
        }

        public async Task<T> PatchAsync<T>(string endpoint, object body)
        {
            try
            {
                var url = CombineUrl(endpoint);
                AddAuthorizationHeader();
                var content = SerializeContent(body);
                var request = new HttpRequestMessage(HttpMethod.Patch, url) { Content = content };
                var response = await _httpClient.SendAsync(request);
                return await HandleResponse<T>(response);
            }
            catch (Exception ex)
            {
                throw new ApiException($"PATCH {endpoint} failed", ex);
            }
        }

        public async Task DeleteAsync(string endpoint)
        {
            try
            {
                var url = CombineUrl(endpoint);
                AddAuthorizationHeader();
                var response = await _httpClient.DeleteAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    throw new HttpRequestException($"Delete failed with status {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                throw new ApiException($"DELETE {endpoint} failed", ex);
            }
        }

        private string CombineUrl(string endpoint)
        {
            if (endpoint.StartsWith("/"))
                return _baseUrl + endpoint;
            return _baseUrl + "/" + endpoint;
        }

        private HttpContent SerializeContent(object body)
        {
            var json = JsonConvert.SerializeObject(body);
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        private void AddAuthorizationHeader()
        {
            _httpClient.DefaultRequestHeaders.Authorization = string.IsNullOrWhiteSpace(_tokenStore.Token)
                ? null
                : new AuthenticationHeaderValue("Bearer", _tokenStore.Token);
        }

        private async Task<T> HandleResponse<T>(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw MapHttpError(response.StatusCode, content);
            }

            if (string.IsNullOrEmpty(content))
                return default;

            return JsonConvert.DeserializeObject<T>(content);
        }

        private Exception MapHttpError(HttpStatusCode statusCode, string responseContent)
        {
            return statusCode switch
            {
                HttpStatusCode.Unauthorized => new UnauthorizedAccessException($"Authentication failed: {responseContent}"),
                HttpStatusCode.Forbidden => new UnauthorizedAccessException($"Access forbidden: {responseContent}"),
                HttpStatusCode.NotFound => new KeyNotFoundException($"Resource not found: {responseContent}"),
                HttpStatusCode.Conflict => new InvalidOperationException($"Conflict: {responseContent}"),
                HttpStatusCode.BadRequest => new ArgumentException($"Bad request: {responseContent}"),
                _ => new HttpRequestException($"API Error ({statusCode}): {responseContent}")
            };
        }
    }

    /// <summary>
    /// Custom exception for API-related errors.
    /// </summary>
    public class ApiException : Exception
    {
        public ApiException(string message) : base(message) { }
        public ApiException(string message, Exception innerException) : base(message, innerException) { }
    }
}
