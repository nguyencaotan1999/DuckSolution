using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.Models
{
    public class Box
    {
        [Key]
        public int Id { get; set; }
        public int STT { get; set; } 
        public int BoxNubmer { get; set; } = 0;
        public decimal BoxWeight { get; set; }  = 0;

        [Required]
        [StringLength(30)]
        public string OrderCode { get; set; } = string.Empty;

        public int UserID { get; set; }

        public OrderModel? Order { get; set; }
    }
}
