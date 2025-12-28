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
        // Make player2_user_id nullable to allow singleplayer (vs bot) saves
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedBigInteger('player2_user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to NOT NULL
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedBigInteger('player2_user_id')->nullable(false)->change();
        });
    }
};
