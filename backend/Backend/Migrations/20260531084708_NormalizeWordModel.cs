using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeWordModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FrequencyRank",
                table: "Words");

            migrationBuilder.RenameColumn(
                name: "Text",
                table: "Words",
                newName: "WordType");

            migrationBuilder.RenameColumn(
                name: "PartOfSpeech",
                table: "Words",
                newName: "Value");

            migrationBuilder.RenameColumn(
                name: "DifficultyLevel",
                table: "Words",
                newName: "WordMeaningCount");

            migrationBuilder.RenameColumn(
                name: "Definition",
                table: "Words",
                newName: "SourceId");

            migrationBuilder.CreateTable(
                name: "WordMeanings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WordId = table.Column<Guid>(type: "uuid", nullable: false),
                    MeaningNo = table.Column<int>(type: "integer", nullable: false),
                    Graminfo = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WordMeanings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WordMeanings_Words_WordId",
                        column: x => x.WordId,
                        principalTable: "Words",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WordMeaningId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    IsReviewed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Definitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Definitions_WordMeanings_WordMeaningId",
                        column: x => x.WordMeaningId,
                        principalTable: "WordMeanings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Examples",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WordMeaningId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    IsReviewed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Examples", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Examples_WordMeanings_WordMeaningId",
                        column: x => x.WordMeaningId,
                        principalTable: "WordMeanings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Definitions_WordMeaningId",
                table: "Definitions",
                column: "WordMeaningId");

            migrationBuilder.CreateIndex(
                name: "IX_Examples_WordMeaningId",
                table: "Examples",
                column: "WordMeaningId");

            migrationBuilder.CreateIndex(
                name: "IX_WordMeanings_WordId",
                table: "WordMeanings",
                column: "WordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Definitions");

            migrationBuilder.DropTable(
                name: "Examples");

            migrationBuilder.DropTable(
                name: "WordMeanings");

            migrationBuilder.RenameColumn(
                name: "WordType",
                table: "Words",
                newName: "Text");

            migrationBuilder.RenameColumn(
                name: "WordMeaningCount",
                table: "Words",
                newName: "DifficultyLevel");

            migrationBuilder.RenameColumn(
                name: "Value",
                table: "Words",
                newName: "PartOfSpeech");

            migrationBuilder.RenameColumn(
                name: "SourceId",
                table: "Words",
                newName: "Definition");

            migrationBuilder.AddColumn<double>(
                name: "FrequencyRank",
                table: "Words",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
