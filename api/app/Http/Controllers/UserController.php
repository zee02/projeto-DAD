<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
        ]);

        $user = $request->user();
        $file = $request->file('photo');

        // Delete old avatar if exists
        if ($user->photo_avatar_filename && Storage::disk('public')->exists('avatars/' . $user->photo_avatar_filename)) {
            Storage::disk('public')->delete('avatars/' . $user->photo_avatar_filename);
        }

        // Store new avatar
        $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, 'public');

        // Update user
        $user->update(['photo_avatar_filename' => $filename]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'photo_avatar_filename' => $filename,
            'photo_avatar_url' => asset('storage/avatars/' . $filename),
            'user' => $user,
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully. Please login again.',
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $request->validate(['password' => 'nullable|string']);
        $user = $request->user();

        // Only check password if it was provided
        if ($request->has('password') && $request->password) {
            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Password is incorrect'], 422);
            }
        }

        // Set coins to zero before deleting
        $user->coins_balance = 0;
        $user->save();

        $user->delete();
        $user->tokens()->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }
}
