using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DUCKSolution.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateModelVer11 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CodeDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    code1 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    code2 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    code3 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    code4 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    code5 = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodeDetails", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CodeDetails");
        }
    }
}
