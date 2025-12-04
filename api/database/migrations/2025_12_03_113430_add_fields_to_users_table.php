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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'type')) {
                $table->string('type')->default('user');
            }
            if (!Schema::hasColumn('users', 'blocked')) {
                $table->boolean('blocked')->default(false);
            }
            if (!Schema::hasColumn('users', 'photo_avatar_filename')) {
                $table->string('photo_avatar_filename')->nullable();
            }
            if (!Schema::hasColumn('users', 'coins_balance')) {
                $table->integer('coins_balance')->default(0);
            }
            if (!Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('users', 'type')) {
                $columns[] = 'type';
            }
            if (Schema::hasColumn('users', 'blocked')) {
                $columns[] = 'blocked';
            }
            if (Schema::hasColumn('users', 'photo_avatar_filename')) {
                $columns[] = 'photo_avatar_filename';
            }
            if (Schema::hasColumn('users', 'coins_balance')) {
                $columns[] = 'coins_balance';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
            if (Schema::hasColumn('users', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
