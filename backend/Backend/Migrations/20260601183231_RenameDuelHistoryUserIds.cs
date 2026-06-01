using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RenameDuelHistoryUserIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DuelHistories_Users_Player1Id",
                table: "DuelHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_DuelHistories_Users_Player2Id",
                table: "DuelHistories");

            migrationBuilder.DropIndex(
                name: "IX_DuelHistories_Player1Id",
                table: "DuelHistories");

            migrationBuilder.DropIndex(
                name: "IX_DuelHistories_Player2Id",
                table: "DuelHistories");

            migrationBuilder.DropColumn(
                name: "Player1Id",
                table: "DuelHistories");

            migrationBuilder.DropColumn(
                name: "Player2Id",
                table: "DuelHistories");

            migrationBuilder.CreateIndex(
                name: "IX_DuelHistories_Player1UserId",
                table: "DuelHistories",
                column: "Player1UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DuelHistories_Player2UserId",
                table: "DuelHistories",
                column: "Player2UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DuelHistories_Users_Player1UserId",
                table: "DuelHistories",
                column: "Player1UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DuelHistories_Users_Player2UserId",
                table: "DuelHistories",
                column: "Player2UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DuelHistories_Users_Player1UserId",
                table: "DuelHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_DuelHistories_Users_Player2UserId",
                table: "DuelHistories");

            migrationBuilder.DropIndex(
                name: "IX_DuelHistories_Player1UserId",
                table: "DuelHistories");

            migrationBuilder.DropIndex(
                name: "IX_DuelHistories_Player2UserId",
                table: "DuelHistories");

            migrationBuilder.AddColumn<Guid>(
                name: "Player1Id",
                table: "DuelHistories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Player2Id",
                table: "DuelHistories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_DuelHistories_Player1Id",
                table: "DuelHistories",
                column: "Player1Id");

            migrationBuilder.CreateIndex(
                name: "IX_DuelHistories_Player2Id",
                table: "DuelHistories",
                column: "Player2Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DuelHistories_Users_Player1Id",
                table: "DuelHistories",
                column: "Player1Id",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DuelHistories_Users_Player2Id",
                table: "DuelHistories",
                column: "Player2Id",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
