using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    public class CodeDetailDto
    {
        [Range(0, double.MaxValue, ErrorMessage = "Mã 1 không hợp lệ.")]
        public decimal? code1 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 2 không hợp lệ.")]
        public decimal? code2 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 3 không hợp lệ.")]
        public decimal? code3 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 4 không hợp lệ.")]
        public decimal? code4 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 5 không hợp lệ.")]
        public decimal? code5 { get; set; }
    }

    /// <summary>
    /// Payload posted from DuckCalculationPage when saving the order parameters
    /// and the related 5-code detail. Mirrors the fields fetched by GetDuckData.
    /// Numeric fields are nullable so an empty input maps to "not provided".
    /// </summary>
    public class DuckCalculationRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập mã đơn hàng.")]
        public string OrderCode { get; set; } = string.Empty;

        // ---- OrderModel fields ----
        // Số con vịt trong lồng
        [Range(0, int.MaxValue, ErrorMessage = "Số con vịt trong lồng không hợp lệ.")]
        public int? totalDuckinBox { get; set; }

        // Số lồng 1 lần cân
        [Range(0, int.MaxValue, ErrorMessage = "Số lồng 1 lần cân không hợp lệ.")]
        public int? totalBoxInOneTime { get; set; }

        // Tổng số ký lồng (OrderModel.totalBoxKg)
        [Range(0, double.MaxValue, ErrorMessage = "Tổng số ký lồng không hợp lệ.")]
        public decimal? BoxWeight { get; set; }

        // Số vịt muốn trừ
        [Range(0, int.MaxValue, ErrorMessage = "Số vịt trừ không hợp lệ.")]
        public int? decreaseDuck { get; set; }

        // Giá vịt xuất
        [Range(0, double.MaxValue, ErrorMessage = "Giá vịt xuất không hợp lệ.")]
        public decimal? currency { get; set; }

        // ---- CodeDetail fields (stored as decimals in the DB) ----
        [Range(0, double.MaxValue, ErrorMessage = "Mã 1 không hợp lệ.")]
        public decimal? code1 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 2 không hợp lệ.")]
        public decimal? code2 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 3 không hợp lệ.")]
        public decimal? code3 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 4 không hợp lệ.")]
        public decimal? code4 { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mã 5 không hợp lệ.")]
        public decimal? code5 { get; set; }

        // Multi-row payload from #duckTableBody.
        public List<CodeDetailDto> codeDetails { get; set; } = new();
    }
}
