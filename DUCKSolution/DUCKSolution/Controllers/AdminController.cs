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

        /// <summary>
        /// Looks up an order by OrderCode plus its related CodeDetail (5 codes).
        /// Consumed via AJAX by the "Lấy dữ liệu" button on DuckCalculationPage.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetDuckData(string orderCode)
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
            var boxdetail = await _context.Boxes.FirstOrDefaultAsync(b => b.OrderCode == orderCode);

            var codeDetail = await _context.CodeDetails
                .FirstOrDefaultAsync(c => c.OrderCode == orderCode);

            return Json(new
            {
                success = true,
                message = $"Đã tải dữ liệu cho đơn hàng \"{orderCode}\".",
                totalDuckinBox = order.totalDuckinBox,
                totalBoxInOneTime = order.totalBoxInOneTime,
                BoxWeight = order.totalBoxKg,
                decreaseDuck = order.decreaseDuck,
                currency = order.currency,
                code1 = codeDetail?.code1 ?? 0,
                code2 = codeDetail?.code2 ?? 0,
                code3 = codeDetail?.code3 ?? 0,
                code4 = codeDetail?.code4 ?? 0,
                code5 = codeDetail?.code5 ?? 0,
                totalBoxKg = boxdetail?.BoxWeight ?? 0
            });
        }

        /// <summary>
        /// Saves (creates or updates) an order and its related CodeDetail from
        /// DuckCalculationPage inside a single transaction to keep both in sync.
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveDuckData([FromBody] DuckCalculationRequestDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.OrderCode))
            {
                return Json(new { success = false, message = "Thiếu mã đơn hàng." });
            }

            if (!ModelState.IsValid)
            {
                var firstError = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .FirstOrDefault() ?? "Dữ liệu không hợp lệ.";
                return Json(new { success = false, message = firstError });
            }

            var orderCode = model.OrderCode.Trim();

            var codeDetails = model.codeDetails ?? new List<CodeDetailDto>();
            if (codeDetails.Count == 0)
            {
                return Json(new { success = false, message = "Không có dữ liệu mã để lưu." });
            }

            foreach (var item in codeDetails)
            {
                if ((item.code1 ?? 0) < 0 ||
                    (item.code2 ?? 0) < 0 ||
                    (item.code3 ?? 0) < 0 ||
                    (item.code4 ?? 0) < 0 ||
                    (item.code5 ?? 0) < 0)
                {
                    return Json(new { success = false, message = "Dữ liệu mã không hợp lệ." });
                }
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

                if (order == null)
                {
                    // Create a new order when the code does not exist yet.
                    order = new OrderModel
                    {
                        OrderCode = orderCode,
                        OrderDate = DateTime.Now,
                        CreateDate = DateTime.Now
                    };
                    _context.Orders.Add(order);
                }

                order.totalDuckinBox = model.totalDuckinBox ?? order.totalDuckinBox;
                order.totalBoxInOneTime = model.totalBoxInOneTime ?? order.totalBoxInOneTime;
                order.totalBoxKg = model.BoxWeight ?? order.totalBoxKg;
                order.decreaseDuck = model.decreaseDuck ?? order.decreaseDuck;
                order.currency = model.currency ?? order.currency;

                var existingCodeDetails = await _context.CodeDetails
                    .Where(c => c.OrderCode == orderCode)
                    .ToListAsync();
                _context.CodeDetails.RemoveRange(existingCodeDetails);

                var codeDetailEntities = codeDetails.Select(item => new CodeDetail
                {
                    OrderCode = orderCode,
                    code1 = item.code1 ?? 0,
                    code2 = item.code2 ?? 0,
                    code3 = item.code3 ?? 0,
                    code4 = item.code4 ?? 0,
                    code5 = item.code5 ?? 0
                }).ToList();

                await _context.CodeDetails.AddRangeAsync(codeDetailEntities);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Json(new { success = true, message = "Đã lưu dữ liệu thành công.", rowCount = codeDetailEntities.Count });
            }
            catch
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Lưu dữ liệu thất bại. Vui lòng thử lại." });
            }
        }
    }
}
