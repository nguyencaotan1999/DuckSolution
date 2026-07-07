using DUCKSolution.Data;
using DUCKSolution.Models;
using DUCKSolution.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;

namespace DUCKSolution.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;
        private readonly ILogger<HomeController> _logger;

        public HomeController(AppDbContext context, ILogger<HomeController> logger)
        {
            _context = context;
            _logger = logger;
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
        [Route("Home/CreateNewCalculationAsync")]
        public async Task<IActionResult> CreateNewCalculationAsync([FromForm]  string? orderCode, [FromForm] int? userId)
        {
            var (resolvedOrderCode, resolvedUserId) = await ResolveCreateRequestAsync(orderCode, userId);

            if (string.IsNullOrWhiteSpace(resolvedOrderCode))
            {
                _logger.LogWarning("CreateNewCalculationAsync validation failed: OrderCode is empty. User={User}", User?.Identity?.Name);
                return Json(new { success = false, message = "Mã đơn hàng không được để trống.", errorType = "validation" });
            }

            if (!resolvedUserId.HasValue || resolvedUserId.Value <= 0)
            {
                _logger.LogWarning("CreateNewCalculationAsync validation failed: UserId is invalid. RawUserId={UserId}", resolvedUserId);
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.", errorType = "validation" });
            }

            if (!await ValidateAuthenticatedUserAsync(resolvedUserId.Value))
            {
                _logger.LogWarning("CreateNewCalculationAsync authorization failed. ClaimUserId={ClaimUserId}, RequestUserId={RequestUserId}", GetAuthenticatedUserId(), resolvedUserId.Value);
                return Json(new { success = false, message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.", errorType = "validation" });
            }

            var orderCodeValue = resolvedOrderCode.Trim().ToUpper();

            try
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                var Order = new OrderModel
                {
                    OrderCode = orderCodeValue,
                    UserID = resolvedUserId.Value,
                };
                var Box = new Box
                {
                    OrderCode = orderCodeValue,
                    UserID = resolvedUserId.Value,
                };
                var CodeDetail = new CodeDetail
                {
                    OrderCode = orderCodeValue,
                    UserID = resolvedUserId.Value,
                };
                _context.Orders.Add(Order);
                _context.Boxes.Add(Box);
                _context.CodeDetails.Add(CodeDetail);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("CreateNewCalculationAsync succeeded. OrderCode={OrderCode}, UserId={UserId}", orderCodeValue, resolvedUserId.Value);
                return Json(new
                {
                    success = true,
                    message = "Tạo mã đơn hàng " + orderCodeValue + " thành công",
                    data = new { orderCode = orderCodeValue, userId = resolvedUserId.Value }
                });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateNewCalculationAsync failed. OrderCode={OrderCode}, UserId={UserId}", resolvedOrderCode, resolvedUserId);
                return Json(new { success = false, message = "Tạo mới thất bại. Vui lòng thử lại.", errorType = "system" });
            }
        }

        private async Task<(string? OrderCode, int? UserId)> ResolveCreateRequestAsync(string? orderCode, int? userId)
        {
            if (!string.IsNullOrWhiteSpace(orderCode) && userId.HasValue && userId.Value > 0)
            {
                return (orderCode, userId);
            }

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();

                if (string.IsNullOrWhiteSpace(orderCode))
                {
                    orderCode = form["orderCode"].FirstOrDefault() ?? form["OrderCode"].FirstOrDefault();
                }

                if ((!userId.HasValue || userId.Value <= 0))
                {
                    var rawUserId = form["userId"].FirstOrDefault() ?? form["UserId"].FirstOrDefault();
                    if (int.TryParse(rawUserId, out var parsedUserId) && parsedUserId > 0)
                    {
                        userId = parsedUserId;
                    }
                }

                return (orderCode, userId);
            }

            if (Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
            {
                try
                {
                    Request.EnableBuffering();
                    using var reader = new StreamReader(Request.Body, leaveOpen: true);
                    var rawBody = await reader.ReadToEndAsync();
                    Request.Body.Position = 0;

                    if (!string.IsNullOrWhiteSpace(rawBody))
                    {
                        var payload = JsonSerializer.Deserialize<BoxSaveViewModel>(rawBody, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (payload != null)
                        {
                            orderCode ??= payload.OrderCode;
                            if ((!userId.HasValue || userId.Value <= 0) && payload.UserId > 0)
                            {
                                userId = payload.UserId;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "CreateNewCalculationAsync could not parse JSON request body.");
                }
            }

            return (orderCode, userId);
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
