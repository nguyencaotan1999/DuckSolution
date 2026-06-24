using DUCKSolution.Models;
using Microsoft.EntityFrameworkCore;

namespace DUCKSolution.Data
{
    public class AppDbContext : DbContext
    {

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        //public DbSet<DuckBatch> DuckBatches { get; set; }
        //public DbSet<ExportCalculation> ExportCalculations { get; set; }
        public DbSet<OrderModel> Orders { get; set; }
        public DbSet<UserModel> Users { get; set; }
        public DbSet<Box> Boxes { get; set; } 

        }
}
