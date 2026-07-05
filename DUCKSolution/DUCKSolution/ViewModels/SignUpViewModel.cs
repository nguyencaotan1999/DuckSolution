using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    /// <summary>
    /// Backing model for the sign-up form (SignUpPage.cshtml).
    /// Maps to the User table fields plus a client-side confirm-password check.
    /// </summary>
    public class SignUpViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập tên người dùng.")]
        [Display(Name = "Tên người dùng")]
        [StringLength(100, ErrorMessage = "Tên người dùng tối đa 100 ký tự.")]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [Display(Name = "Email")]
        [StringLength(200, ErrorMessage = "Email tối đa 200 ký tự.")]
        public string UserEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        [StringLength(64, MinimumLength = 8, ErrorMessage = "Mật khẩu phải từ 8 đến 64 ký tự.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$", ErrorMessage = "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.")]
        public string UserPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Xác nhận mật khẩu")]
        [Compare(nameof(UserPassword), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
