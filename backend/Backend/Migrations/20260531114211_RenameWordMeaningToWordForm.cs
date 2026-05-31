using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RenameWordMeaningToWordForm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Definitions_WordMeanings_WordMeaningId",
                table: "Definitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Examples_WordMeanings_WordMeaningId",
                table: "Examples");

            migrationBuilder.RenameTable(
                name: "WordMeanings",
                newName: "WordForms");

            migrationBuilder.RenameColumn(
                name: "MeaningNo",
                table: "WordForms",
                newName: "FormNo");

            migrationBuilder.RenameIndex(
                name: "IX_WordMeanings_WordId",
                table: "WordForms",
                newName: "IX_WordForms_WordId");

            migrationBuilder.RenameColumn(
                name: "WordMeaningCount",
                table: "Words",
                newName: "WordFormCount");

            migrationBuilder.RenameColumn(
                name: "WordMeaningId",
                table: "Examples",
                newName: "WordFormId");

            migrationBuilder.RenameIndex(
                name: "IX_Examples_WordMeaningId",
                table: "Examples",
                newName: "IX_Examples_WordFormId");

            migrationBuilder.RenameColumn(
                name: "WordMeaningId",
                table: "Definitions",
                newName: "WordFormId");

            migrationBuilder.RenameIndex(
                name: "IX_Definitions_WordMeaningId",
                table: "Definitions",
                newName: "IX_Definitions_WordFormId");

            migrationBuilder.AddForeignKey(
                name: "FK_Definitions_WordForms_WordFormId",
                table: "Definitions",
                column: "WordFormId",
                principalTable: "WordForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Examples_WordForms_WordFormId",
                table: "Examples",
                column: "WordFormId",
                principalTable: "WordForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Definitions_WordForms_WordFormId",
                table: "Definitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Examples_WordForms_WordFormId",
                table: "Examples");

            migrationBuilder.DropTable(
                name: "WordForms");

            migrationBuilder.RenameColumn(
                name: "WordFormCount",
                table: "Words",
                newName: "WordMeaningCount");

            migrationBuilder.RenameColumn(
                name: "WordFormId",
                table: "Examples",
                newName: "WordMeaningId");

            migrationBuilder.RenameIndex(
                name: "IX_Examples_WordFormId",
                table: "Examples",
                newName: "IX_Examples_WordMeaningId");

            migrationBuilder.RenameColumn(
                name: "WordFormId",
                table: "Definitions",
                newName: "WordMeaningId");

            migrationBuilder.RenameIndex(
                name: "IX_Definitions_WordFormId",
                table: "Definitions",
                newName: "IX_Definitions_WordMeaningId");

            migrationBuilder.CreateTable(
                name: "WordMeanings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WordId = table.Column<Guid>(type: "uuid", nullable: false),
                    Graminfo = table.Column<string>(type: "text", nullable: true),
                    MeaningNo = table.Column<int>(type: "integer", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_WordMeanings_WordId",
                table: "WordMeanings",
                column: "WordId");

            migrationBuilder.AddForeignKey(
                name: "FK_Definitions_WordMeanings_WordMeaningId",
                table: "Definitions",
                column: "WordMeaningId",
                principalTable: "WordMeanings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Examples_WordMeanings_WordMeaningId",
                table: "Examples",
                column: "WordMeaningId",
                principalTable: "WordMeanings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
