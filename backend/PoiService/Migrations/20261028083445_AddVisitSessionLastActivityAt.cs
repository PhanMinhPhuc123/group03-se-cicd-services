using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PoiService.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitSessionLastActivityAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "VisitSessions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_VisitSessions_LastActivityAt",
                table: "VisitSessions",
                column: "LastActivityAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VisitSessions_LastActivityAt",
                table: "VisitSessions");

            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "VisitSessions");
        }
    }
}
