using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    /// <summary>
    /// Payload posted from BoxCalculationPage when saving the editable box table.
    /// </summary>
    public class BoxSaveViewModel
    {
        [Range(1, int.MaxValue, ErrorMessage = "Thiếu người dùng đăng nhập.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Thiếu mã đơn hàng (OrderCode).")]
        [StringLength(30, ErrorMessage = "Mã đơn hàng tối đa 30 ký tự.")]
        public string OrderCode { get; set; } = string.Empty;

        [Range(0, int.MaxValue, ErrorMessage = "Số lồng 1 lần cân không hợp lệ.")]
        public int TotalBoxInOneTime { get; set; }

        public List<BoxRowViewModel> Rows { get; set; } = new();
    }

    /// <summary>
    /// A single editable row. Note: BoxNubmer keeps the exact entity field name.
    /// </summary>
    public class BoxRowViewModel
    {
        public int STT { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mã 1 không hợp lệ.")]
        public int BoxCode1 { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mã 2 không hợp lệ.")]
        public int BoxCode2 { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mã 3 không hợp lệ.")]
        public int BoxCode3 { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mã 4 không hợp lệ.")]
        public int BoxCode4 { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mã 5 không hợp lệ.")]
        public int BoxCode5 { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số Lồng không hợp lệ.")]
        public int BoxNubmer { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số Ký không hợp lệ.")]
        public decimal BoxWeight { get; set; }
    }
}
