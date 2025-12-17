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
        Schema::create('game_tricks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            
            // Trick/turn number (1-based: 1, 2, 3, etc.)
            $table->integer('trick_number');
            
            // First card played in the trick
            $table->string('card1_id'); // e.g., 'HA' (Heart Ace)
            $table->string('card1_suit'); // H, D, C, S
            $table->string('card1_rank'); // A, 7, K, J, Q, 6, 5, 4, 3, 2
            $table->integer('card1_value')->default(0); // Point value
            $table->foreignId('card1_player_id')->constrained('users')->onDelete('cascade');
            
            // Second card played in the trick
            $table->string('card2_id');
            $table->string('card2_suit');
            $table->string('card2_rank');
            $table->integer('card2_value')->default(0);
            $table->foreignId('card2_player_id')->constrained('users')->onDelete('cascade');
            
            // Trick winner
            $table->foreignId('winner_user_id')->constrained('users')->onDelete('cascade');
            $table->integer('points_won'); // Total points from both cards
            
            // Trump information for context
            $table->string('trump_suit')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_tricks');
    }
};
