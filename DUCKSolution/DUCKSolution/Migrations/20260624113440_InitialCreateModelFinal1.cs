using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DUCKSolution.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateModelFinal1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Boxes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    STT = table.Column<int>(type: "int", nullable: false),
                    BoxNubmer = table.Column<int>(type: "int", nullable: false),
                    BoxWeight = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderCode = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boxes", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Boxes");
        }
    }
}
