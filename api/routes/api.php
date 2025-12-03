<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
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
});

Route::apiResource('games', GameController::class);