using DUCKSolution.Data;
using DUCKSolution.Models;
using DUCKSolution.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DUCKSolution.Controllers
{
    public class AdminController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<UserModel> _passwordHasher;

        public AdminController(AppDbContext context, IPasswordHasher<UserModel> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpGet]
        public IActionResult SignInPage()
        {
            return View(new SignInViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignInPage(SignInViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var loginId = model.LoginId.Trim();
            var normalized = Normalize(loginId);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.NormalizedUserName == normalized || u.NormalizedUserEmail == normalized);

            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Tên người dùng/email hoặc mật khẩu không đúng.");
                return View(model);
            }

            var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.UserPassword);
            if (verify == PasswordVerificationResult.Failed)
            {
                ModelState.AddModelError(string.Empty, "Tên người dùng/email hoặc mật khẩu không đúng.");
                return View(model);
            }

            ViewData["SignedInUserId"] = user.UserID;
            ViewData["SignInSuccess"] = "Đăng nhập thành công. Đang chuyển trang...";
            ViewData["RedirectUrl"] = Url.Action(nameof(BoxCalculationPage));

            model.UserPassword = string.Empty;
            return View(model);
        }

        [HttpGet]
        public IActionResult SignUpPage()
        {
            return View(new SignUpViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignUpPage(SignUpViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var userName = model.UserName.Trim();
            var email = model.UserEmail.Trim();

            var normalizedUserName = Normalize(userName);
            var normalizedEmail = Normalize(email);

            var duplicateUser = await _context.Users.AnyAsync(u => u.NormalizedUserName == normalizedUserName);
            if (duplicateUser)
            {
                ModelState.AddModelError(nameof(model.UserName), "Tên người dùng đã tồn tại.");
                return View(model);
            }

            var duplicateEmail = await _context.Users.AnyAsync(u => u.NormalizedUserEmail == normalizedEmail);
            if (duplicateEmail)
            {
                ModelState.AddModelError(nameof(model.UserEmail), "Email đã tồn tại.");
                return View(model);
            }

            var user = new UserModel
            {
                UserName = userName,
                UserEmail = email,
                NormalizedUserName = normalizedUserName,
                NormalizedUserEmail = normalizedEmail,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, model.UserPassword);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            TempData["SignUpSuccess"] = "Đăng ký thành công. Vui lòng đăng nhập.";
            return RedirectToAction(nameof(SignInPage));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Logout()
        {
            return Json(new { success = true, message = "Đăng xuất thành công." });
        }

        [HttpGet]
        public IActionResult BoxCalculationPage()
        {
            return View();
        }

        [HttpGet]
        public IActionResult DuckCalculationPage()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetBoxData(int userId, string orderCode)
        {
            if (!await ValidateUserExists(userId))
            {
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
            }

            if (string.IsNullOrWhiteSpace(orderCode))
            {
                return Json(new { success = false, message = "Vui lòng nhập mã đơn hàng." });
            }

            orderCode = orderCode.Trim();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderCode == orderCode && o.UserID == userId);

            if (order == null)
            {
                return Json(new { success = false, message = $"Không tìm thấy đơn hàng \"{orderCode}\" cho người dùng hiện tại." });
            }

            var boxes = await _context.Boxes
                .Where(b => b.OrderCode == orderCode && b.UserID == userId)
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

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveBoxData([FromBody] BoxSaveViewModel model)
        {
            if (model == null || !ModelState.IsValid)
            {
                return Json(new { success = false, message = GetFirstModelError() ?? "Dữ liệu không hợp lệ." });
            }

            if (!await ValidateUserExists(model.UserId))
            {
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
            }

            var orderCode = model.OrderCode.Trim();
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
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

                if (order == null)
                {
                    order = new OrderModel
                    {
                        OrderCode = orderCode,
                        UserID = model.UserId,
                        OrderDate = DateTime.Now,
                        CreateDate = DateTime.Now
                    };
                    _context.Orders.Add(order);
                }
                else if (order.UserID != model.UserId)
                {
                    return Json(new { success = false, message = "Mã đơn hàng đã thuộc về người dùng khác." });
                }

                var existing = await _context.Boxes
                    .Where(b => b.OrderCode == orderCode && b.UserID == model.UserId)
                    .ToListAsync();
                _context.Boxes.RemoveRange(existing);

                int stt = 1;
                int totalBox = 0;
                decimal totalBoxKg = 0m;

                foreach (var row in rows)
                {
                    _context.Boxes.Add(new Box
                    {
                        STT = stt++,
                        BoxNubmer = row.BoxNubmer,
                        BoxWeight = row.BoxWeight,
                        OrderCode = orderCode,
                        UserID = model.UserId
                    });

                    totalBox += row.BoxNubmer;
                    totalBoxKg += row.BoxWeight;
                }

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

        [HttpDelete]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteBoxData(int userId, string orderCode)
        {
            if (!await ValidateUserExists(userId) || string.IsNullOrWhiteSpace(orderCode))
            {
                return Json(new { success = false, message = "Yêu cầu xóa không hợp lệ." });
            }

            var normalizedCode = orderCode.Trim();
            var rows = await _context.Boxes
                .Where(b => b.UserID == userId && b.OrderCode == normalizedCode)
                .ToListAsync();

            if (rows.Count == 0)
            {
                return Json(new { success = false, message = "Không có dữ liệu Box để xóa." });
            }

            _context.Boxes.RemoveRange(rows);

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.UserID == userId && o.OrderCode == normalizedCode);
            if (order != null)
            {
                order.totalBox = 0;
                order.totalBoxKg = 0;
            }

            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã xóa dữ liệu Box." });
        }

        [HttpGet]
        public async Task<IActionResult> GetDuckData(int userId, string orderCode)
        {
            if (!await ValidateUserExists(userId))
            {
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
            }

            if (string.IsNullOrWhiteSpace(orderCode))
            {
                return Json(new { success = false, message = "Vui lòng nhập mã đơn hàng." });
            }

            orderCode = orderCode.Trim();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderCode == orderCode && o.UserID == userId);

            if (order == null)
            {
                return Json(new { success = false, message = $"Không tìm thấy đơn hàng \"{orderCode}\" cho người dùng hiện tại." });
            }

            var codeDetails = await _context.CodeDetails
                .Where(c => c.OrderCode == orderCode && c.UserID == userId)
                .OrderBy(c => c.Id)
                .Select(c => new
                {
                    code1 = c.code1,
                    code2 = c.code2,
                    code3 = c.code3,
                    code4 = c.code4,
                    code5 = c.code5
                })
                .ToListAsync();

            var boxdetail = await _context.Boxes
                .FirstOrDefaultAsync(b => b.OrderCode == orderCode && b.UserID == userId);

            var firstCodeDetail = codeDetails.FirstOrDefault();

            return Json(new
            {
                success = true,
                message = $"Đã tải dữ liệu cho đơn hàng \"{orderCode}\".",
                totalDuckinBox = order.totalDuckinBox,
                totalBoxInOneTime = order.totalBoxInOneTime,
                BoxWeight = order.totalBoxKg,
                decreaseDuck = order.decreaseDuck,
                currency = order.currency,
                code1 = firstCodeDetail?.code1 ?? 0,
                code2 = firstCodeDetail?.code2 ?? 0,
                code3 = firstCodeDetail?.code3 ?? 0,
                code4 = firstCodeDetail?.code4 ?? 0,
                code5 = firstCodeDetail?.code5 ?? 0,
                totalBoxKg = boxdetail?.BoxWeight ?? 0,
                codeDetails
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveDuckData([FromBody] DuckCalculationRequestDto model)
        {
            if (model == null || !ModelState.IsValid)
            {
                return Json(new { success = false, message = GetFirstModelError() ?? "Dữ liệu không hợp lệ." });
            }

            if (!await ValidateUserExists(model.UserId))
            {
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
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
                    order = new OrderModel
                    {
                        OrderCode = orderCode,
                        UserID = model.UserId,
                        OrderDate = DateTime.Now,
                        CreateDate = DateTime.Now
                    };
                    _context.Orders.Add(order);
                }
                else if (order.UserID != model.UserId)
                {
                    return Json(new { success = false, message = "Mã đơn hàng đã thuộc về người dùng khác." });
                }

                order.totalDuckinBox = model.totalDuckinBox ?? order.totalDuckinBox;
                order.totalBoxInOneTime = model.totalBoxInOneTime ?? order.totalBoxInOneTime;
                order.totalBoxKg = model.BoxWeight ?? order.totalBoxKg;
                order.decreaseDuck = model.decreaseDuck ?? order.decreaseDuck;
                order.currency = model.currency ?? order.currency;

                var existingCodeDetails = await _context.CodeDetails
                    .Where(c => c.OrderCode == orderCode && c.UserID == model.UserId)
                    .ToListAsync();
                _context.CodeDetails.RemoveRange(existingCodeDetails);

                var codeDetailEntities = codeDetails.Select(item => new CodeDetail
                {
                    OrderCode = orderCode,
                    UserID = model.UserId,
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

        [HttpDelete]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteDuckData(int userId, string orderCode)
        {
            if (!await ValidateUserExists(userId) || string.IsNullOrWhiteSpace(orderCode))
            {
                return Json(new { success = false, message = "Yêu cầu xóa không hợp lệ." });
            }

            var normalizedCode = orderCode.Trim();
            var rows = await _context.CodeDetails
                .Where(c => c.UserID == userId && c.OrderCode == normalizedCode)
                .ToListAsync();

            if (rows.Count == 0)
            {
                return Json(new { success = false, message = "Không có dữ liệu Duck để xóa." });
            }

            _context.CodeDetails.RemoveRange(rows);
            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã xóa dữ liệu Duck." });
        }

        private async Task<bool> ValidateUserExists(int userId)
        {
            if (userId <= 0)
            {
                return false;
            }

            return await _context.Users.AnyAsync(u => u.UserID == userId);
        }

        private string? GetFirstModelError()
        {
            return ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault(e => !string.IsNullOrWhiteSpace(e));
        }

        private static string Normalize(string value)
        {
            return value.Trim().ToUpperInvariant();
        }
    }
}
