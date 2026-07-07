using DUCKSolution.Data;
using DUCKSolution.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Security.Claims;

namespace DUCKSolution.Controllers
{
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;
        public  HomeController(AppDbContext context)
        {
            _context = context;
        }
        public IActionResult Index()
        {
            return View();
        }
        [Authorize]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpGet]
        public IActionResult HomePage() {
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

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateNewCalculationAsync(string orderCode, int userId)
        {
            if (orderCode == null || userId == 0 || !ModelState.IsValid)
            {
                return Json(new { success = false, message = "Dữ liệu không hợp lệ." });
            }
            if (!await ValidateAuthenticatedUserAsync(userId))
            {
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
            }
            var orderCodeValue = orderCode.Trim().ToUpper(); ;
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var Order = new OrderModel
                {
                    OrderCode = orderCodeValue,
                    UserID = userId,
                };
                var Box = new Box
                {
                    OrderCode = orderCodeValue,
                    UserID = userId,
                };
                var CodeDetail = new CodeDetail
                {
                    OrderCode = orderCodeValue,
                    UserID = userId,
                };
                _context.Orders.Add(Order);
                _context.Boxes.Add(Box);
                _context.CodeDetails.Add(CodeDetail);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Json(new { success = true, message = "Tạo mã đơn hàng "+ orderCode + " thành công"});

            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Tạo mới thất bại. Vui lòng thử lại." });
            }
        }

        private async Task<bool> ValidateAuthenticatedUserAsync(int userId)
        {
            if (userId <= 0)
            {
                return false;
            }

            var authenticatedUserId = GetAuthenticatedUserId();
            if (authenticatedUserId <= 0 || authenticatedUserId != userId)
            {
                return false;
            }

            return await _context.Users.AnyAsync(u => u.UserID == userId);
        }
        private int GetAuthenticatedUserId()
        {
            var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(rawUserId, out var userId) ? userId : 0;
        }
    }
}
