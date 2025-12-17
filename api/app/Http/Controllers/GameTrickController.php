<?php

namespace App\Http\Controllers;

use App\Models\GameTrick;
use Illuminate\Http\Request;

class GameTrickController extends Controller
{
    /**
     * Store a newly created trick in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'game_id' => 'required|exists:games,id',
            'trick_number' => 'required|integer',
            'card1_id' => 'required|string',
            'card1_suit' => 'required|string',
            'card1_rank' => 'required|string',
            'card1_value' => 'required|integer',
            'card1_player_id' => 'required|exists:users,id',
            'card2_id' => 'required|string',
            'card2_suit' => 'required|string',
            'card2_rank' => 'required|string',
            'card2_value' => 'required|integer',
            'card2_player_id' => 'required|exists:users,id',
            'winner_user_id' => 'required|exists:users,id',
            'points_won' => 'required|integer',
            'trump_suit' => 'nullable|string',
        ]);

        $trick = GameTrick::create($validated);

        return response()->json([
            'message' => 'Trick saved successfully',
            'data' => $trick
        ], 201);
    }

    /**
     * Store multiple tricks in batch.
     */
    public function storeBatch(Request $request)
    {
        $validated = $request->validate([
            'tricks' => 'required|array',
            'tricks.*.game_id' => 'required|exists:games,id',
            'tricks.*.trick_number' => 'required|integer',
            'tricks.*.card1_id' => 'required|string',
            'tricks.*.card1_suit' => 'required|string',
            'tricks.*.card1_rank' => 'required|string',
            'tricks.*.card1_value' => 'required|integer',
            'tricks.*.card1_player_id' => 'required|exists:users,id',
            'tricks.*.card2_id' => 'required|string',
            'tricks.*.card2_suit' => 'required|string',
            'tricks.*.card2_rank' => 'required|string',
            'tricks.*.card2_value' => 'required|integer',
            'tricks.*.card2_player_id' => 'required|exists:users,id',
            'tricks.*.winner_user_id' => 'required|exists:users,id',
            'tricks.*.points_won' => 'required|integer',
            'tricks.*.trump_suit' => 'nullable|string',
        ]);

        $tricks = [];
        foreach ($validated['tricks'] as $trickData) {
            $tricks[] = GameTrick::create($trickData);
        }

        return response()->json([
            'message' => 'Tricks saved successfully',
            'data' => $tricks
        ], 201);
    }
}
