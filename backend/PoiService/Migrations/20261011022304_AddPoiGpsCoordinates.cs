using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PoiService.Migrations
{
    /// <inheritdoc />
    public partial class AddPoiGpsCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "POIs",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "POIs",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "POIs");
        }
    }
}
