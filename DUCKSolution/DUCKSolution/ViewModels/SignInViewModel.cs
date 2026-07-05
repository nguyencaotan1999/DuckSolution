using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    /// <summary>
    /// Backing model for the sign-in form (SignInPage.cshtml).
    /// </summary>
    public class SignInViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập tên người dùng hoặc email.")]
        [Display(Name = "Tên người dùng / Email")]
        [StringLength(200, ErrorMessage = "Thông tin đăng nhập tối đa 200 ký tự.")]
        public string LoginId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        public string UserPassword { get; set; } = string.Empty;
    }
}
