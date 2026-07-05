namespace DUCKSolution.Configuration
{
    public class AuthorizationSettings
    {
        public const string SectionName = "Authorization";

        public string RegisterAllowedEmail { get; set; } = string.Empty;
    }
}