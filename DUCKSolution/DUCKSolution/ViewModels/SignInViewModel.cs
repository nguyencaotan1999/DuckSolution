using System.ComponentModel.DataAnnotations;

namespace DUCKSolution.ViewModels
{
    /// <summary>
    /// Backing model for the sign-in form (SignInPage.cshtml).
    /// </summary>
    public class SignInViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [Display(Name = "Email")]
        public string UserEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        public string UserPassword { get; set; } = string.Empty;
    }
}
