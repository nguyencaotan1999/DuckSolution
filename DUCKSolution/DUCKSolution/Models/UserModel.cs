using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.Models
{
    public class UserModel
    {
        [Key]
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPassword { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
    }
}
