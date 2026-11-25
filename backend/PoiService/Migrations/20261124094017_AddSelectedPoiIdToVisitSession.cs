using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PoiService.Migrations
{
    /// <inheritdoc />
    public partial class AddSelectedPoiIdToVisitSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SelectedPoiId",
                table: "visitor_sessions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedPoiId",
                table: "visitor_sessions");
        }
    }
}
