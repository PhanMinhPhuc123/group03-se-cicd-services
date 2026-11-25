using System;
using System.Net;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PoiService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pois",
                columns: table => new
                {
                    poi_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    name_search = table.Column<string>(type: "text", nullable: false),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    address_search = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pois", x => x.poi_id);
                });

            migrationBuilder.CreateTable(
                name: "tours",
                columns: table => new
                {
                    tour_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tours", x => x.tour_id);
                });

            migrationBuilder.CreateTable(
                name: "visitor_sessions",
                columns: table => new
                {
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_active_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    device_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<IPAddress>(type: "inet", nullable: true),
                    ui_language_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    gps_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "not_requested"),
                    latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    gps_consent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    gps_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    selected_poi_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_visitor_sessions", x => x.session_id);
                    table.CheckConstraint("ck_visitor_sessions_coordinates_pair", "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");
                    table.CheckConstraint("ck_visitor_sessions_coordinates_require_granted", "gps_status = 'granted' OR (latitude IS NULL AND longitude IS NULL)");
                    table.CheckConstraint("ck_visitor_sessions_gps_granted_requires_coordinates", "gps_status <> 'granted' OR (latitude IS NOT NULL AND longitude IS NOT NULL)");
                    table.CheckConstraint("ck_visitor_sessions_gps_status", "gps_status IN ('not_requested', 'granted', 'denied', 'unavailable', 'error')");
                });

            migrationBuilder.CreateTable(
                name: "tour_pois",
                columns: table => new
                {
                    tour_id = table.Column<Guid>(type: "uuid", nullable: false),
                    poi_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    added_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tour_pois", x => new { x.tour_id, x.poi_id });
                    table.ForeignKey(
                        name: "FK_tour_pois_pois_poi_id",
                        column: x => x.poi_id,
                        principalTable: "pois",
                        principalColumn: "poi_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tour_pois_tours_tour_id",
                        column: x => x.tour_id,
                        principalTable: "tours",
                        principalColumn: "tour_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tour_pois_poi_id",
                table: "tour_pois",
                column: "poi_id");

            migrationBuilder.CreateIndex(
                name: "IX_visitor_sessions_last_active_at",
                table: "visitor_sessions",
                column: "last_active_at");

            migrationBuilder.CreateIndex(
                name: "IX_visitor_sessions_started_at",
                table: "visitor_sessions",
                column: "started_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tour_pois");

            migrationBuilder.DropTable(
                name: "visitor_sessions");

            migrationBuilder.DropTable(
                name: "pois");

            migrationBuilder.DropTable(
                name: "tours");
        }
    }
}
