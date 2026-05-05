using ChordRadarAdmin.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChordRadarAdmin.Core.Services
{
    public interface IChordService
    {
        Task<List<ChordDto>> GetAllAsync(Dictionary<string, string> fields = null);
        Task<ChordDto> GetByIdAsync(int id);
        Task<List<ChordDto>> GetByNotationAndTuningAsync(string notation, string tuning);
        Task<ChordDto> CreateAsync(string notation, string tuning, string grip);
        Task<ChordDto> UpdateAsync(int id, string notation = null, string tuning = null, string grip = null);
        Task DeleteAsync(int id);
    }

    public interface IGripService
    {
        Task<List<GripDto>> GetAllAsync();
        Task<GripDto> GetByIdAsync(int id);
        Task<GripDto> CreateAsync(string strings);
        Task<GripDto> UpdateAsync(int id, string strings);
        Task DeleteAsync(int id);
    }

    public interface ITuningService
    {
        Task<List<TuningDto>> GetAllAsync();
        Task<TuningDto> GetByIdAsync(int id);
        Task<TuningDto> CreateAsync(string value);
        Task<TuningDto> UpdateAsync(int id, string value);
        Task DeleteAsync(int id);
    }

    public interface INotationService
    {
        Task<List<NotationDto>> GetAllAsync();
        Task<NotationDto> GetByIdAsync(int id);
        Task<NotationDto> CreateAsync(string value);
        Task<NotationDto> UpdateAsync(int id, string value);
        Task DeleteAsync(int id);
    }

    public interface IUserService
    {
        Task<List<UserDto>> GetAllAsync();
        Task<UserDto> GetByIdAsync(int id);
        Task<UserDto> GetByEmailAsync(string email);
        Task<UserDto> CreateAsync(UserDto user);
        Task<UserDto> UpdateAsync(int id, UserDto user);
        Task DeleteAsync(int id);
    }
}
