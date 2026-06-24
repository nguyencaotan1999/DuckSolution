using DUCKSolution.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace DUCKSolution.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
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

    }
}
