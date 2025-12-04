<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    protected function ensureAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->type ?? '') !== 'A') {
            abort(403, 'Forbidden');
        }
    }

    public function users(Request $request)
    {
        $this->ensureAdmin($request);

        $perPage = (int) $request->input('per_page', 25);
        $query = User::query()->select(['id', 'name', 'email', 'type', 'blocked', 'created_at'])->orderBy('id', 'desc');

        $users = $query->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function updateUserBlock(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'blocked' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->blocked = $request->input('blocked');
        $user->save();

        return response()->json([
            'message' => 'User updated',
            'user' => $user,
        ]);
    }

    public function updateUser(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'type' => 'sometimes|required|in:A,P',
            'blocked' => 'sometimes|boolean',
            'password' => 'sometimes|string|min:6',
            'nickname' => 'sometimes|nullable|string|max:255',
            'bio' => 'sometimes|nullable|string|max:2000',
            'coins_balance' => 'sometimes|integer',
        ]);

        $data = $request->only(['name', 'email', 'type', 'blocked', 'nickname', 'bio', 'coins_balance']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->input('password'));
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated',
            'user' => $user,
        ]);
    }

    public function deleteUser(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        // Prevent admins from deleting themselves
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function showUser(Request $request, $id)
    {
        $this->ensureAdmin($request);
        $user = User::select(['id', 'name', 'email', 'type', 'blocked', 'created_at', 'nickname', 'bio', 'coins_balance', 'photo_avatar_filename'])->findOrFail($id);

        $photo_url = null;
        if ($user->photo_avatar_filename) {
            $photo_url = asset('storage/avatars/' . $user->photo_avatar_filename);
        }

        $u = $user->toArray();
        $u['photo_avatar_url'] = $photo_url;

        return response()->json(['user' => $u]);
    }

    public function uploadUserAvatar(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $user = User::findOrFail($id);
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

    public function createAdmin(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'type' => 'A',
            'blocked' => false,
        ]);

        return response()->json([
            'message' => 'Administrator created',
            'user' => $user,
        ], 201);
    }

    public function transactions(Request $request)
    {
        $this->ensureAdmin($request);

        $perPage = (int) $request->input('per_page', 25);

        $query = CoinTransaction::with(['user', 'transactionType'])->orderBy('transaction_datetime', 'desc');
        $transactions = $query->paginate($perPage);

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }
}
