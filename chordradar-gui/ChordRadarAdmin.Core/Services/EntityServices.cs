using ChordRadarAdmin.Core.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    public class ChordService : IChordService
    {
        private readonly IApiService _apiService;
        private static readonly Dictionary<string, string> ResolvedChordFields = new Dictionary<string, string>
        {
            ["notation"] = "value",
            ["tuning"] = "value",
            ["grip"] = "value"
        };

        public ChordService(IApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<List<ChordDto>> GetAllAsync(Dictionary<string, string> fields = null)
        {
            var endpoint = "/api/chords/gui";
            var requestedFields = fields != null && fields.Any() ? fields : ResolvedChordFields;
            if (requestedFields.Any())
            {
                var fieldsJson = Newtonsoft.Json.JsonConvert.SerializeObject(requestedFields);
                endpoint += $"?fields={System.Web.HttpUtility.UrlEncode(fieldsJson)}";
            }

            return await _apiService.GetAsync<List<ChordDto>>(endpoint) ?? new List<ChordDto>();
        }

        public async Task<ChordDto> GetByIdAsync(int id)
        {
            var fieldsJson = Newtonsoft.Json.JsonConvert.SerializeObject(ResolvedChordFields);
            return await _apiService.GetAsync<ChordDto>($"/api/chords/{id}?fields={System.Web.HttpUtility.UrlEncode(fieldsJson)}");
        }

        public async Task<List<ChordDto>> GetByNotationAndTuningAsync(string notation, string tuning)
        {
            var endpoint = $"/api/chords/notation/{notation}/tuning/{tuning}";
            return await _apiService.GetAsync<List<ChordDto>>(endpoint) ?? new List<ChordDto>();
        }

        public async Task<ChordDto> CreateAsync(string notation, string tuning, string grip)
        {
            var body = new { notation, tuning, grip };
            var created = await _apiService.PostAsync<ChordDto>("/api/chords", body);
            return await NormalizeChordAsync(created, notation, tuning, grip);
        }

        public async Task<ChordDto> UpdateAsync(int id, string notation = null, string tuning = null, string grip = null)
        {
            var body = new Dictionary<string, string>();

            if (!string.IsNullOrWhiteSpace(notation))
            {
                body["notation"] = notation;
            }

            if (!string.IsNullOrWhiteSpace(tuning))
            {
                body["tuning"] = tuning;
            }

            if (!string.IsNullOrWhiteSpace(grip))
            {
                body["grip"] = grip;
            }

            if (body.Count == 0)
            {
                throw new System.ArgumentException("At least one field must be provided for chord update.");
            }

            var updated = await _apiService.PatchAsync<ChordDto>($"/api/chords/{id}", body);
            return await NormalizeChordAsync(
                updated,
                notation ?? string.Empty,
                tuning ?? string.Empty,
                grip ?? string.Empty,
                id
            );
        }

        public async Task DeleteAsync(int id)
        {
            await _apiService.DeleteAsync($"/api/chords/{id}");
        }

        private async Task<ChordDto> NormalizeChordAsync(ChordDto chord, string notation, string tuning, string grip, int? fallbackId = null)
        {
            var chordId = chord?.Id ?? fallbackId ?? 0;
            if (chordId > 0)
            {
                try
                {
                    var hydrated = await GetByIdAsync(chordId);
                    if (hydrated != null && !string.IsNullOrWhiteSpace(hydrated.Notation))
                    {
                        return hydrated;
                    }
                }
                catch
                {
                    // Keep optimistic fallback data if hydration fails.
                }
            }

            return new ChordDto
            {
                Id = chordId,
                Notation = chord?.Notation ?? notation,
                Tuning = chord?.Tuning ?? tuning,
                Grip = chord?.Grip ?? grip,
                CreatedAt = chord?.CreatedAt ?? default,
                UpdatedAt = chord?.UpdatedAt ?? default,
            };
        }
    }

    public class GripService : IGripService
    {
        private readonly IApiService _apiService;

        public GripService(IApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<List<GripDto>> GetAllAsync()
        {
            return await _apiService.GetAsync<List<GripDto>>("/api/grips") ?? new List<GripDto>();
        }

        public async Task<GripDto> GetByIdAsync(int id)
        {
            return await _apiService.GetAsync<GripDto>($"/api/grips/{id}");
        }

        public async Task<GripDto> CreateAsync(string strings)
        {
            var body = new { strings };
            return await _apiService.PostAsync<GripDto>("/api/grips", body);
        }

        public async Task<GripDto> UpdateAsync(int id, string strings)
        {
            var body = new { strings };
            return await _apiService.PutAsync<GripDto>($"/api/grips/{id}", body);
        }

        public async Task DeleteAsync(int id)
        {
            await _apiService.DeleteAsync($"/api/grips/{id}");
        }
    }

    public class TuningService : ITuningService
    {
        private readonly IApiService _apiService;

        public TuningService(IApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<List<TuningDto>> GetAllAsync()
        {
            return await _apiService.GetAsync<List<TuningDto>>("/api/tunings") ?? new List<TuningDto>();
        }

        public async Task<TuningDto> GetByIdAsync(int id)
        {
            return await _apiService.GetAsync<TuningDto>($"/api/tunings/{id}");
        }

        public async Task<TuningDto> CreateAsync(string value)
        {
            var body = new { value };
            return await _apiService.PostAsync<TuningDto>("/api/tunings", body);
        }

        public async Task<TuningDto> UpdateAsync(int id, string value)
        {
            var body = new { value };
            return await _apiService.PutAsync<TuningDto>($"/api/tunings/{id}", body);
        }

        public async Task DeleteAsync(int id)
        {
            await _apiService.DeleteAsync($"/api/tunings/{id}");
        }
    }

    public class NotationService : INotationService
    {
        private readonly IApiService _apiService;

        public NotationService(IApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<List<NotationDto>> GetAllAsync()
        {
            return await _apiService.GetAsync<List<NotationDto>>("/api/notations") ?? new List<NotationDto>();
        }

        public async Task<NotationDto> GetByIdAsync(int id)
        {
            return await _apiService.GetAsync<NotationDto>($"/api/notations/{id}");
        }

        public async Task<NotationDto> CreateAsync(string value)
        {
            var body = new { value };
            return await _apiService.PostAsync<NotationDto>("/api/notations", body);
        }

        public async Task<NotationDto> UpdateAsync(int id, string value)
        {
            var body = new { value };
            return await _apiService.PutAsync<NotationDto>($"/api/notations/{id}", body);
        }

        public async Task DeleteAsync(int id)
        {
            await _apiService.DeleteAsync($"/api/notations/{id}");
        }
    }

    public class UserService : IUserService
    {
        private readonly IApiService _apiService;

        public UserService(IApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<List<UserDto>> GetAllAsync()
        {
            return await _apiService.GetAsync<List<UserDto>>("/users") ?? new List<UserDto>();
        }

        public async Task<UserDto> GetByIdAsync(int id)
        {
            return await _apiService.GetAsync<UserDto>($"/users/id/{id}");
        }

        public async Task<UserDto> GetByEmailAsync(string email)
        {
            return await _apiService.GetAsync<UserDto>($"/users/email/{System.Web.HttpUtility.UrlEncode(email)}");
        }

        public async Task<UserDto> CreateAsync(UserDto user)
        {
            var body = new
            {
                user_name = user.UserName,
                first_name = user.FirstName,
                last_name = user.LastName,
                email_address = user.EmailAddress,
                password = user.Password,
                email_verified = user.EmailVerified,
                role = user.Role,
                status = user.Status
            };

            return await _apiService.PostAsync<UserDto>("/users", body);
        }

        public async Task<UserDto> UpdateAsync(int id, UserDto user)
        {
            var body = new
            {
                user_name = user.UserName,
                first_name = user.FirstName,
                last_name = user.LastName,
                email_address = user.EmailAddress,
                email_verified = user.EmailVerified,
                role = user.Role,
                status = user.Status
            };

            return await _apiService.PatchAsync<UserDto>($"/users/{id}", body);
        }

        public async Task DeleteAsync(int id)
        {
            await _apiService.DeleteAsync($"/users/{id}");
        }
    }
}
