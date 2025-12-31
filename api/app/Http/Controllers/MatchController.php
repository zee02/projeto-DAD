<?php

namespace App\Http\Controllers;

use App\Models\BiscaMatch;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    /**
     * Armazenar resultado de uma partida (Match) finalizada
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'required|exists:users,id',
            'winner_user_id' => 'required|exists:users,id',
            'game_type' => 'required|in:3,9',
            'bet_per_game' => 'required|integer|min:0',
            'max_wins' => 'required|integer|min:1',
            'player1_wins' => 'required|integer|min:0',
            'player2_wins' => 'required|integer|min:0',
            'player1_coins_bet' => 'required|integer|min:0',
            'player2_coins_bet' => 'required|integer|min:0',
            'player1_coins_won' => 'required|integer|min:0',
            'player2_coins_won' => 'required|integer|min:0',
            'games_data' => 'nullable|array',
        ]);

        $match = BiscaMatch::create(array_merge($validated, [
            'status' => 'finished',
        ]));

        // TODO: Atualizar coins dos players (debit/credit)

        return response()->json([
            'message' => 'Match saved successfully',
            'data' => $match->load('player1', 'player2', 'winner')
        ], 201);
    }

    /**
     * Obter histórico de partidas do player
     */
    public function playerMatches(Request $request)
    {
        $user = $request->user();

        $matches = BiscaMatch::query()
            ->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            })
            ->with(['player1', 'player2', 'winner'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => $matches->items(),
            'meta' => [
                'current_page' => $matches->currentPage(),
                'last_page' => $matches->lastPage(),
                'per_page' => $matches->perPage(),
                'total' => $matches->total()
            ]
        ]);
    }

    /**
     * Obter leaderboard de partidas (by wins)
     */
    public function leaderboardByWins()
    {
        $leaders = BiscaMatch::query()
            ->where('status', 'finished')
            ->selectRaw('
                CASE
                    WHEN winner_user_id = player1_user_id THEN player1_user_id
                    ELSE player2_user_id
                END as user_id,
                COUNT(*) as wins
            ')
            ->groupBy('user_id')
            ->orderBy('wins', 'desc')
            ->limit(100)
            ->get();

        return response()->json($leaders);
    }

    /**
     * Estatísticas de um player em partidas
     */
    public function playerStats(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_matches' => BiscaMatch::where('status', 'finished')
                ->where(function ($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->count(),
            'wins' => BiscaMatch::where('winner_user_id', $user->id)
                ->where('status', 'finished')
                ->count(),
            'total_coins_bet' => BiscaMatch::where('status', 'finished')
                ->where(function ($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
                })
                ->selectRaw('
                    COALESCE(SUM(CASE WHEN player1_user_id = ? THEN player1_coins_bet ELSE 0 END), 0) +
                    COALESCE(SUM(CASE WHEN player2_user_id = ? THEN player2_coins_bet ELSE 0 END), 0) as total
                ', [$user->id, $user->id])
                ->value('total') ?? 0,
            'total_coins_won' => BiscaMatch::where('winner_user_id', $user->id)
                ->where('status', 'finished')
                ->selectRaw('
                    COALESCE(SUM(CASE WHEN winner_user_id = player1_user_id THEN player1_coins_won ELSE player2_coins_won END), 0) as total
                ')
                ->value('total') ?? 0,
        ];

        return response()->json($stats);
    }
}
