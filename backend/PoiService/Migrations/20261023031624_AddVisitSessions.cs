using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PoiService.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisitSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    POIId = table.Column<int>(type: "integer", nullable: true),
                    EntryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExitTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    LocationConsent = table.Column<bool>(type: "boolean", nullable: false),
                    ExitReason = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitSessions_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisitSessions_EntryTime",
                table: "VisitSessions",
                column: "EntryTime");

            migrationBuilder.CreateIndex(
                name: "IX_VisitSessions_POIId",
                table: "VisitSessions",
                column: "POIId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisitSessions");
        }
    }
}
