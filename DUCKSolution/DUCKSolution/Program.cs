using DUCKSolution.Configuration;
using DUCKSolution.Data;
using DUCKSolution.Models;
using DUCKSolution.Security;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);
var registerAllowedEmail = builder.Configuration[$"{AuthorizationSettings.SectionName}:RegisterAllowedEmail"] ?? string.Empty;

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IPasswordHasher<UserModel>, PasswordHasher<UserModel>>();
builder.Services.Configure<AuthorizationSettings>(builder.Configuration.GetSection(AuthorizationSettings.SectionName));

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Admin/SignInPage";
        options.AccessDeniedPath = "/Home/HomePage";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppAuthorizationPolicies.RegisterAccess, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            string.Equals(
                context.User.FindFirstValue(ClaimTypes.Email),
                registerAllowedEmail,
                StringComparison.OrdinalIgnoreCase));
    });
});

// Let AJAX calls supply the anti-forgery token via a request header
// (box-calculation.ts posts JSON to /Admin/SaveBoxData with this header).
builder.Services.AddAntiforgery(options => options.HeaderName = "RequestVerificationToken");

builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("AzureConnection")));


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsGet(context.Request.Method) && context.User.Identity?.IsAuthenticated == true)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            context.Response.Headers.Pragma = "no-cache";
            context.Response.Headers.Expires = "0";
            return Task.CompletedTask;
        });
    }

    await next();
});

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=HomePage}/{id?}")
    .WithStaticAssets();


app.Run();
