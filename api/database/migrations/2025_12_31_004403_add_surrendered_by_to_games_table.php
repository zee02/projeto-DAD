<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Add surrendered_by column if it doesn't exist
            if (!Schema::hasColumn('games', 'surrendered_by')) {
                $table->unsignedBigInteger('surrendered_by')->nullable()->after('loser_user_id');
                $table->foreign('surrendered_by')->references('id')->on('users');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropForeign(['surrendered_by']);
            $table->dropColumn('surrendered_by');
        });
    }
};
