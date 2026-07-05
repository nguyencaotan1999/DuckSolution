using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.Models
{
    public class CodeDetail
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(30)]
        public string OrderCode { get; set; } = string.Empty;

        public int UserID { get; set; }

        public decimal code1 { get; set; } = 0;
        public decimal code2 { get; set; } = 0;
        public decimal code3 { get; set; } = 0;
        public decimal code4 { get; set; } = 0;
        public decimal code5 { get; set; } = 0;

        public OrderModel? Order { get; set; }
    }
}
