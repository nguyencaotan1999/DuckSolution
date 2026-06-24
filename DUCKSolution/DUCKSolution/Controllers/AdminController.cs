using DUCKSolution.Data;
using DUCKSolution.Models;
using DUCKSolution.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DUCKSolution.Controllers
{
    public class AdminController : Controller
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult SignInPage()
        {
            return View();
        }
        public IActionResult SignUpPage()
        {
            return View();
        }
        public IActionResult BoxCalculationPage()
        {
            return View();
        }
        public IActionResult DuckCalculationPage()
        {
            return View();
        }

        /// <summary>
        /// Looks up an order by OrderCode and returns its related Box rows + summary.
        /// Consumed via AJAX by the "Fetch Data" button.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetBoxData(string orderCode)
        {
            if (string.IsNullOrWhiteSpace(orderCode))
            {
                return Json(new { success = false, message = "Vui lòng nhập mã đơn hàng." });
            }

            orderCode = orderCode.Trim();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

            if (order == null)
            {
                return Json(new { success = false, message = $"Không tìm thấy đơn hàng \"{orderCode}\"." });
            }

            var boxes = await _context.Boxes
                .Where(b => b.OrderCode == orderCode)
                .OrderBy(b => b.STT)
                .Select(b => new
                {
                    stt = b.STT,
                    boxNubmer = b.BoxNubmer,
                    boxWeight = b.BoxWeight
                })
                .ToListAsync();

            return Json(new
            {
                success = true,
                message = $"Đã tải dữ liệu cho đơn hàng \"{orderCode}\".",
                totalBox = order.totalBox,
                totalBoxKg = order.totalBoxKg,
                boxes
            });
        }

        /// <summary>
        /// Persists the edited box rows for an order inside a transaction and
        /// refreshes OrderModel.totalBox / totalBoxKg from the submitted rows.
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveBoxData([FromBody] BoxSaveViewModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.OrderCode))
            {
                return Json(new { success = false, message = "Thiếu mã đơn hàng." });
            }

            var orderCode = model.OrderCode.Trim();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

            if (order == null)
            {
                return Json(new { success = false, message = $"Không tìm thấy đơn hàng \"{orderCode}\"." });
            }

            // Validate rows: drop fully-empty rows, reject negatives.
            var rows = model.Rows ?? new List<BoxRowViewModel>();
            foreach (var row in rows)
            {
                if (row.BoxNubmer < 0 || row.BoxWeight < 0)
                {
                    return Json(new { success = false, message = "Giá trị Số Lồng / Số Ký không được âm." });
                }
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Replace existing boxes for this order with the submitted set.
                var existing = await _context.Boxes
                    .Where(b => b.OrderCode == orderCode)
                    .ToListAsync();
                _context.Boxes.RemoveRange(existing);

                int stt = 1;
                int totalBox = 0;
                decimal totalBoxKg = 0m;

                foreach (var row in rows)
                {
                    var box = new Box
                    {
                        STT = stt++,
                        BoxNubmer = row.BoxNubmer,
                        BoxWeight = row.BoxWeight,
                        OrderCode = orderCode
                    };
                    _context.Boxes.Add(box);

                    totalBox += row.BoxNubmer;
                    totalBoxKg += row.BoxWeight;
                }

                // Refresh the order summary from the submitted rows.
                order.totalBox = totalBox;
                order.totalBoxKg = totalBoxKg;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Json(new
                {
                    success = true,
                    message = "Đã lưu dữ liệu thành công.",
                    totalBox,
                    totalBoxKg,
                    rowCount = rows.Count
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Lưu dữ liệu thất bại. Vui lòng thử lại." });
            }
        }
    }
}
