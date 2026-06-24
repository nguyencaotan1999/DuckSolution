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
        [StringLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [Display(Name = "Email")]
        public string UserEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        public string UserPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Xác nhận mật khẩu")]
        [Compare(nameof(UserPassword), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
