using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    /// <summary>
    /// Payload posted from BoxCalculationPage when saving the editable box table.
    /// </summary>
    public class BoxSaveViewModel
    {
        [Required(ErrorMessage = "Thiếu mã đơn hàng (OrderCode).")]
        public string OrderCode { get; set; } = string.Empty;

        public List<BoxRowViewModel> Rows { get; set; } = new();
    }

    /// <summary>
    /// A single editable row. Note: BoxNubmer keeps the exact entity field name.
    /// </summary>
    public class BoxRowViewModel
    {
        public int STT { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số Lồng không hợp lệ.")]
        public int BoxNubmer { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số Ký không hợp lệ.")]
        public decimal BoxWeight { get; set; }
    }
}
