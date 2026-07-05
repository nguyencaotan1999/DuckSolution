using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.Models
{
    public class UserModel
    {
        [Key]
        public int UserID { get; set; }

        [Required]
        [StringLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string NormalizedUserName { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string NormalizedUserEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(512)]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrderModel> Orders { get; set; } = new List<OrderModel>();
    }
}
