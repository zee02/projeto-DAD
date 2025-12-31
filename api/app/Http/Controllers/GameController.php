<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function __construct()
    {
        // Allow game saves from the websocket service (no Sanctum token), still protect game details
        $this->middleware('auth:sanctum')->only(['show']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Game::query()->with(['winner']);

        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted', 'Surrendered'])) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = [
            'began_at',
            'ended_at',
            'total_time',
            'type',
            'status'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    /**
     * Display a listing of the authenticated user's games.
     */
    public function myGames(Request $request)
    {
        $user = $request->user();

        $query = Game::query()->with(['player1', 'player2', 'winner', 'loser'])
            ->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            });

        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted', 'Surrendered'])) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = [
            'began_at',
            'ended_at',
            'total_time',
            'type',
            'status'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:3,9',
            'player1_user_id' => 'nullable|exists:users,id',
            'player2_user_id' => 'nullable|exists:users,id',
            'is_draw' => 'boolean',
            'winner_user_id' => 'nullable|exists:users,id',
            'loser_user_id' => 'nullable|exists:users,id',
            'surrendered_by' => 'nullable|exists:users,id',
            'match_id' => 'nullable|integer',
            'status' => 'nullable|in:Pending,Playing,Ended,Interrupted,Surrendered',
            'began_at' => 'required|date',
            'ended_at' => 'required|date',
            'total_time' => 'required|numeric',
            'player1_points' => 'required|integer',
            'player2_points' => 'required|integer',
            'custom' => 'nullable|array',
        ]);

        // Set default status if not provided
        if (!isset($validated['status'])) {
            $validated['status'] = 'Ended';
        }

        $game = Game::create($validated);

        return response()->json([
            'message' => 'Game saved successfully',
            'data' => $game
        ], 201);
    }

    /**
     * Display the specified resource with detailed trick history.
     */
    public function show(Request $request, Game $game)
    {
        $user = $request->user();
        
        // Authorization: users can only see their own games, admins can see all
        if ($user->type !== 'A' && $game->player1_user_id !== $user->id && $game->player2_user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $game->load([
            'player1',
            'player2',
            'winner',
            'loser',
            'tricks.card1Player',
            'tricks.card2Player',
            'tricks.winner'
        ]);

        return response()->json([
            'data' => $game
        ]);
    }

    /**
     * Get game replay with all tricks for a specific game.
     */
    public function replay(Request $request, $id)
    {
        $user = $request->user();
        $game = Game::with([
            'player1',
            'player2',
            'winner',
            'loser',
            'tricks.card1Player',
            'tricks.card2Player',
            'tricks.winner'
        ])->findOrFail($id);

        // Authorization: users can only see their own games, admins can see all
        if ($user->type !== 'A' && $game->player1_user_id !== $user->id && $game->player2_user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => [
                'game' => $game,
                'tricks' => $game->tricks,
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
