using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderID { get; set; }
        public DateTime OrderDate { get; set; }
        public int quantity { get; set; } = 0;
        public decimal price { get; set; } = 0;
        public decimal totalKG { get; set; } = 0;
        public decimal totalKGAvg { get; set; } = 0;
        public decimal totalPrice { get; set; } = 0;

        public int UserID { get; set; }

        public UserModel? User { get; set; }

        [Required]
        [StringLength(30)]
        public string OrderCode { get; set; } = string.Empty;
        public int totalBox { get; set; } = 0;
        public decimal totalBoxKg { get; set; } = 0;
        public int totalDuckinBox { get; set; } = 0;
        public int totalBoxInOneTime { get; set; } = 0;
        public int decreaseDuck { get; set; } = 0;
        public decimal currency { get; set; } = 0;

        public DateTime CreateDate { get; set; } = DateTime.Now;

        public ICollection<Box> Boxes { get; set; } = new List<Box>();

        public ICollection<CodeDetail> CodeDetails { get; set; } = new List<CodeDetail>();

    }
}
