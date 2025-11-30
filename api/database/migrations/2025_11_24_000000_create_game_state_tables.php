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
        // Track the current state of an active game
        Schema::create('game_states', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id')->unique();
            $table->foreign('game_id')->references('id')->on('games')->onDelete('cascade');

            // Whose turn it is (player1 or player2)
            $table->unsignedBigInteger('current_player_user_id');
            $table->foreign('current_player_user_id')->references('id')->on('users');

            // Trump suit: 0=Hearts(Copas), 1=Diamonds(Ouros), 2=Clubs(Paus), 3=Spades(Espadas)
            $table->integer('trump_suit')->default(0);

            // Trump card rank: 1=Ace, 2-6, 7=Seven(Bisca), 8=Queen, 9=Jack, 10=King
            $table->integer('trump_rank')->default(1);

            // How many cards have been dealt from initial hand
            $table->integer('dealt_cards_count')->default(0);

            // How many cards remain in the stock
            $table->integer('stock_remaining_count')->default(40);

            // Game phase: 'drawing' (can draw from stock) or 'final' (must follow suit)
            $table->enum('game_phase', ['drawing', 'final'])->default('drawing');

            // Current trick number (0-based)
            $table->integer('current_trick_number')->default(0);

            // What cards were led in current trick (if any)
            $table->unsignedBigInteger('current_trick_led_card_id')->nullable();
            $table->foreign('current_trick_led_card_id')->references('id')->on('game_cards')->nullOnDelete();

            // Timestamp when this game state was last updated
            $table->timestamps();
            $table->softDeletes();
        });

        // Individual cards dealt in the game
        Schema::create('game_cards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id');
            $table->foreign('game_id')->references('id')->on('games')->onDelete('cascade');

            // Card suit: 0=Hearts(Copas), 1=Diamonds(Ouros), 2=Clubs(Paus), 3=Spades(Espadas)
            $table->integer('card_suit');

            // Card rank: 1=Ace(Ás), 2-6=2-6, 7=Seven(Sete/Bisca), 8=Queen(Dama), 9=Jack(Valete), 10=King(Rei)
            $table->integer('card_rank');

            // Points value: Ace=11, Seven=10, King=4, Jack=3, Queen=2, others=0
            $table->integer('points_value');

            // Original dealt to which player (1 or 2)
            $table->unsignedBigInteger('dealt_to_user_id')->nullable();
            $table->foreign('dealt_to_user_id')->references('id')->on('users')->nullOnDelete();

            // Current owner: who has this card now (in hand, or won it)
            $table->unsignedBigInteger('current_owner_user_id')->nullable();
            $table->foreign('current_owner_user_id')->references('id')->on('users')->nullOnDelete();

            // Which trick this card was played in (null if still in hand or stock)
            $table->unsignedBigInteger('trick_id')->nullable();
            $table->foreign('trick_id')->references('id')->on('game_rounds')->nullOnDelete();

            // Position in stock/deck: 0-39 (0 = trump card, 1-39 = rest of deck)
            // null = card was dealt or played
            $table->integer('stock_position')->nullable();

            // Is this card in the stock pile?
            $table->boolean('is_in_stock')->default(true);

            // Is this card in current player's hand?
            $table->boolean('is_in_hand')->default(false);

            // Timestamps
            $table->timestamps();
            $table->softDeletes();
        });

        // Each trick/round played in the game
        Schema::create('game_rounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id');
            $table->foreign('game_id')->references('id')->on('games')->onDelete('cascade');

            // Which trick number (1-indexed, 0-9 for Bisca de 9, 0-2 for Bisca de 3)
            $table->integer('trick_number');

            // Who led this trick (played first card)
            $table->unsignedBigInteger('led_by_user_id');
            $table->foreign('led_by_user_id')->references('id')->on('users');

            // First card played (led)
            $table->unsignedBigInteger('first_card_id');
            $table->foreign('first_card_id')->references('id')->on('game_cards');

            // Second card played
            $table->unsignedBigInteger('second_card_id')->nullable();
            $table->foreign('second_card_id')->references('id')->on('game_cards')->nullOnDelete();

            // Who won this trick
            $table->unsignedBigInteger('winner_user_id')->nullable();
            $table->foreign('winner_user_id')->references('id')->on('users')->nullOnDelete();

            // Total points from both cards in this trick
            $table->integer('points_won')->default(0);

            // Timestamp when trick was completed
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();
        });

        // Stock/deck pile for the game
        Schema::create('game_stock', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id');
            $table->foreign('game_id')->references('id')->on('games')->onDelete('cascade');

            // The card in the stock
            $table->unsignedBigInteger('card_id');
            $table->foreign('card_id')->references('id')->on('game_cards')->onDelete('cascade');

            // Position in the stock (0 = trump/top visible, 1-39 = below)
            $table->integer('position_in_deck');

            // Has this card been drawn?
            $table->boolean('is_drawn')->default(false);

            // When was it drawn?
            $table->dateTime('drawn_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_stock');
        Schema::dropIfExists('game_rounds');
        Schema::dropIfExists('game_cards');
        Schema::dropIfExists('game_states');
    }
};
