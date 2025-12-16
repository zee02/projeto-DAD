<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bisca_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player1_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('player2_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('winner_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('game_type')->default('3'); // '3' ou '9'
            $table->integer('bet_per_game')->default(2); // moedas por jogo
            $table->integer('max_wins')->default(4); // vitórias necessárias
            $table->integer('player1_wins')->default(0);
            $table->integer('player2_wins')->default(0);
            $table->integer('player1_coins_bet')->default(0);
            $table->integer('player2_coins_bet')->default(0);
            $table->integer('player1_coins_won')->default(0);
            $table->integer('player2_coins_won')->default(0);
            $table->enum('status', ['ongoing', 'finished'])->default('ongoing');
            $table->text('games_data')->nullable(); // JSON com IDs dos games
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bisca_matches');
    }
};
