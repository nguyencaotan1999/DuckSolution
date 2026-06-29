using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DUCKSolution.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateModelVer12 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "currency",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "decreaseDuck",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "totalBoxInOneTime",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "totalDuckinBox",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "currency",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "decreaseDuck",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "totalBoxInOneTime",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "totalDuckinBox",
                table: "Orders");
        }
    }
}
