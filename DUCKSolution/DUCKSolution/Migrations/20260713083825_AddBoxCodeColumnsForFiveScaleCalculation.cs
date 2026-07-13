using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DUCKSolution.Migrations
{
    /// <inheritdoc />
    public partial class AddBoxCodeColumnsForFiveScaleCalculation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BoxCode1",
                table: "Boxes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BoxCode2",
                table: "Boxes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BoxCode3",
                table: "Boxes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BoxCode4",
                table: "Boxes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BoxCode5",
                table: "Boxes",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoxCode1",
                table: "Boxes");

            migrationBuilder.DropColumn(
                name: "BoxCode2",
                table: "Boxes");

            migrationBuilder.DropColumn(
                name: "BoxCode3",
                table: "Boxes");

            migrationBuilder.DropColumn(
                name: "BoxCode4",
                table: "Boxes");

            migrationBuilder.DropColumn(
                name: "BoxCode5",
                table: "Boxes");
        }
    }
}
