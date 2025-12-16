<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// Public auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth user info
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });

    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // User profile routes
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/avatar', [UserController::class, 'uploadAvatar']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::delete('/user/account', [UserController::class, 'deleteAccount']);

    // Coin purchase routes
    Route::post('/coin-purchase/buy', [CoinPurchaseController::class, 'buy']);
    Route::get('/coin-purchase/history', [CoinPurchaseController::class, 'history']);
    
    // User-specific game history
    Route::get('/user/games', [GameController::class, 'myGames']);
    
        // Admin routes (require admin user)
        Route::middleware([\App\Http\Middleware\EnsureAdmin::class])->prefix('admin')->group(function () {
            Route::get('/users', [\App\Http\Controllers\AdminController::class, 'users']);
            Route::patch('/users/{id}/block', [\App\Http\Controllers\AdminController::class, 'updateUserBlock']);
            Route::get('/users/{id}', [\App\Http\Controllers\AdminController::class, 'showUser']);
            Route::post('/users/{id}/avatar', [\App\Http\Controllers\AdminController::class, 'uploadUserAvatar']);
            Route::put('/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser']);
            Route::delete('/users/{id}', [\App\Http\Controllers\AdminController::class, 'deleteUser']);
            Route::post('/admins', [\App\Http\Controllers\AdminController::class, 'createAdmin']);
            Route::get('/transactions', [\App\Http\Controllers\AdminController::class, 'transactions']);
            Route::get('/analytics/sales', [\App\Http\Controllers\StatsController::class, 'salesOverTime']);
            Route::get('/analytics/games', [\App\Http\Controllers\StatsController::class, 'gamesOverTime']);
        });
});

Route::apiResource('games', GameController::class);

// Multiplayer match routes (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/matches', [MatchController::class, 'store']);
    Route::get('/matches/my-matches', [MatchController::class, 'playerMatches']);
    Route::get('/matches/stats', [MatchController::class, 'playerStats']);
});

// Public stats and leaderboards
Route::get('/leaderboards/wins', [\App\Http\Controllers\StatsController::class, 'leaderboardWins']);
Route::get('/leaderboards/capotes', [\App\Http\Controllers\StatsController::class, 'leaderboardCapotes']);
Route::get('/leaderboards/flags', [\App\Http\Controllers\StatsController::class, 'leaderboardFlags']);
Route::get('/leaderboards/games-played', [\App\Http\Controllers\StatsController::class, 'leaderboardGamesPlayed']);
Route::get('/stats/overview', [\App\Http\Controllers\StatsController::class, 'overview']);
Route::get('/stats/anonymous', [\App\Http\Controllers\StatsController::class, 'anonymousStats']);