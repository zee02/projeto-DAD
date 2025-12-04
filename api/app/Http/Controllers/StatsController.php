<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    // Public leaderboards
    public function leaderboardWins(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $page = (int) $request->input('page', 1);

        // Aggregate wins by winner_user_id
        $query = DB::table('games')
            ->select('winner_user_id as user_id', DB::raw('COUNT(*) as total'))
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id')
            ->orderBy('total', 'desc');

        $p = $query->paginate($perPage, ['*'], 'page', $page);

        $items = $p->items();
        $userIds = array_map(fn($i) => $i->user_id, $items);
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $data = array_map(function ($row) use ($users) {
            $u = $users[$row->user_id] ?? null;
            return [
                'user_id' => $row->user_id,
                'name' => $u?->name,
                'nickname' => $u?->nickname,
                'photo_avatar_filename' => $u?->photo_avatar_filename,
                'count' => (int) $row->total,
            ];
        }, $items);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $p->currentPage(),
                'last_page' => $p->lastPage(),
                'per_page' => $p->perPage(),
                'total' => $p->total(),
            ],
        ]);
    }

    public function leaderboardCapotes(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $page = (int) $request->input('page', 1);

        // Fetch games where winner exists and opponent scored zero (capote)
        $games = Game::whereNotNull('winner_user_id')
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereColumn('winner_user_id', 'player1_user_id')->where('player2_points', 0);
                })->orWhere(function ($q3) {
                    $q3->whereColumn('winner_user_id', 'player2_user_id')->where('player1_points', 0);
                });
            })->get(['winner_user_id']);

        $counts = [];
        foreach ($games as $g) {
            $id = $g->winner_user_id;
            if (!$id) continue;
            $counts[$id] = ($counts[$id] ?? 0) + 1;
        }

        arsort($counts);

        $items = array_slice(array_map(function ($id, $count) {
            return ['user_id' => $id, 'count' => $count];
        }, array_keys($counts), $counts), ($page - 1) * $perPage, $perPage);

        $userIds = array_column($items, 'user_id');
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $data = array_map(function ($row) use ($users) {
            $u = $users[$row['user_id']] ?? null;
            return [
                'user_id' => $row['user_id'],
                'name' => $u?->name,
                'nickname' => $u?->nickname,
                'photo_avatar_filename' => $u?->photo_avatar_filename,
                'count' => (int) $row['count'],
            ];
        }, $items);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => array_sum($counts),
            ],
        ]);
    }

    public function leaderboardFlags(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $page = (int) $request->input('page', 1);

        // Count games where custom->flag is truthy
        $games = Game::whereNotNull('winner_user_id')->get(['winner_user_id', 'custom']);
        $counts = [];
        foreach ($games as $g) {
            $custom = $g->custom ?? [];
            $flag = false;
            if (is_array($custom) && array_key_exists('flag', $custom)) {
                $flag = (bool) $custom['flag'];
            }
            if ($flag && $g->winner_user_id) {
                $counts[$g->winner_user_id] = ($counts[$g->winner_user_id] ?? 0) + 1;
            }
        }

        arsort($counts);

        $items = array_slice(array_map(function ($id, $count) {
            return ['user_id' => $id, 'count' => $count];
        }, array_keys($counts), $counts), ($page - 1) * $perPage, $perPage);

        $userIds = array_column($items, 'user_id');
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $data = array_map(function ($row) use ($users) {
            $u = $users[$row['user_id']] ?? null;
            return [
                'user_id' => $row['user_id'],
                'name' => $u?->name,
                'nickname' => $u?->nickname,
                'photo_avatar_filename' => $u?->photo_avatar_filename,
                'count' => (int) $row['count'],
            ];
        }, $items);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => array_sum($counts),
            ],
        ]);
    }

    // Admin analytics (protected by EnsureAdmin middleware)
    public function salesOverTime(Request $request)
    {
        $interval = $request->input('interval', 'day'); // day|month
        $days = (int) $request->input('days', 30);

        if ($days < 1) $days = 1;
        // include today as the last bucket: start from (days - 1) days ago
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = DB::table('coin_purchases')
            ->select(DB::raw("DATE(purchase_datetime) as date"), DB::raw('SUM(euros) as total'))
            ->where('purchase_datetime', '>=', $from)
            ->groupBy(DB::raw('DATE(purchase_datetime)'))
            ->orderBy('date', 'asc')
            ->get();

        // normalize to contiguous dates
        $labels = [];
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            // labels: from .. today (inclusive)
            $d = $from->copy()->addDays($i)->format('Y-m-d');
            $labels[] = $d;
            $series[$d] = 0.0;
        }

        foreach ($rows as $r) {
            $series[$r->date] = (float) $r->total;
        }

        return response()->json([
            'labels' => $labels,
            'data' => array_values($series),
        ]);
    }

    public function gamesOverTime(Request $request)
    {
        $days = (int) $request->input('days', 30);
        if ($days < 1) $days = 1;
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = DB::table('games')
            ->select(DB::raw("DATE(began_at) as date"), DB::raw('COUNT(*) as total'))
            ->whereNotNull('began_at')
            ->where('began_at', '>=', $from)
            ->groupBy(DB::raw('DATE(began_at)'))
            ->orderBy('date', 'asc')
            ->get();

        $labels = [];
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            // labels: from .. today (inclusive)
            $d = $from->copy()->addDays($i)->format('Y-m-d');
            $labels[] = $d;
            $series[$d] = 0;
        }

        foreach ($rows as $r) {
            $series[$r->date] = (int) $r->total;
        }

        return response()->json([
            'labels' => $labels,
            'data' => array_values($series),
        ]);
    }

    // Anonymous aggregated stats (no personal data)
    public function overview(Request $request)
    {
        $total_players = User::where('type', 'P')->count();
        $total_games = Game::count();
        $total_transactions = CoinTransaction::count();
        $total_sales = CoinPurchase::sum('euros');

        return response()->json([
            'total_players' => (int) $total_players,
            'total_games' => (int) $total_games,
            'total_transactions' => (int) $total_transactions,
            'total_sales_euros' => (float) $total_sales,
        ]);
    }

    // Public anonymous statistics for visitors (game-only, no personal or financial info)
    public function anonymousStats(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $from = now()->subDays($days)->startOfDay();

        // Total games
        $total_games = Game::count();

        // Active players (unique player ids in recent games)
        $recentGames = Game::whereNotNull('began_at')->where('began_at', '>=', $from)
            ->get(['player1_user_id', 'player2_user_id']);
        $activeSet = [];
        foreach ($recentGames as $g) {
            if ($g->player1_user_id) $activeSet[$g->player1_user_id] = true;
            if ($g->player2_user_id) $activeSet[$g->player2_user_id] = true;
        }
        $active_players = count($activeSet);

        // Common victories (aggregated counts)
        $wins = Game::whereNotNull('winner_user_id')->count();

        $capotes = Game::whereNotNull('winner_user_id')
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereColumn('winner_user_id', 'player1_user_id')->where('player2_points', 0);
                })->orWhere(function ($q3) {
                    $q3->whereColumn('winner_user_id', 'player2_user_id')->where('player1_points', 0);
                });
            })->count();

        $flags = 0;
        $flagGames = Game::whereNotNull('winner_user_id')->get(['custom']);
        foreach ($flagGames as $g) {
            $custom = $g->custom ?? [];
            if (is_array($custom) && array_key_exists('flag', $custom) && $custom['flag']) {
                $flags++;
            }
        }

        // Global records (anonymous identifiers)
        // Top single-game scores (player id and points)
        // Use CASE expressions instead of GREATEST for broader DB compatibility (SQLite doesn't support GREATEST)
        $topScores = DB::table('games')
            ->selectRaw(
                "id as game_id, 
                 CASE WHEN COALESCE(player1_points,0) >= COALESCE(player2_points,0) THEN COALESCE(player1_points,0) ELSE COALESCE(player2_points,0) END as points, 
                 CASE WHEN COALESCE(player1_points,0) >= COALESCE(player2_points,0) THEN player1_user_id ELSE player2_user_id END as player_id"
            )
            ->whereNotNull('began_at')
            ->orderByDesc('points')
            ->limit(5)
            ->get()
            ->map(function ($r) {
                return [
                    'game_id' => $r->game_id,
                    'player' => $r->player_id ? ('Player #' . $r->player_id) : null,
                    'points' => (int) $r->points,
                ];
            });

        // Top winners by total wins (anonymous)
        $topWinners = DB::table('games')
            ->select('winner_user_id as player_id', DB::raw('COUNT(*) as wins'))
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id')
            ->orderByDesc('wins')
            ->limit(5)
            ->get()
            ->map(function ($r) {
                return [
                    'player' => 'Player #' . $r->player_id,
                    'wins' => (int) $r->wins,
                ];
            });

        // Longest games (by total_time)
        $longestGames = DB::table('games')
            ->select('id as game_id', 'total_time')
            ->whereNotNull('total_time')
            ->orderByDesc('total_time')
            ->limit(5)
            ->get()
            ->map(function ($r) {
                return [
                    'game_id' => $r->game_id,
                    'duration_seconds' => (float) $r->total_time,
                ];
            });

        // Game type distribution
        $types = DB::table('games')
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get()
            ->mapWithKeys(function ($r) {
                return [$r->type ?? 'unknown' => (int) $r->count];
            });

        // Average statistics
        $avgRow = DB::table('games')
            ->selectRaw('AVG((COALESCE(player1_points,0) + COALESCE(player2_points,0)) / 2.0) as avg_points, AVG(total_time) as avg_duration')
            ->first();

        $avg_points = $avgRow->avg_points ? (float) $avgRow->avg_points : 0.0;
        $avg_duration = $avgRow->avg_duration ? (float) $avgRow->avg_duration : 0.0;

        // Trends over time (games per day)
        $rows = DB::table('games')
            ->select(DB::raw("DATE(began_at) as date"), DB::raw('COUNT(*) as total'))
            ->whereNotNull('began_at')
            ->where('began_at', '>=', $from)
            ->groupBy(DB::raw('DATE(began_at)'))
            ->orderBy('date', 'asc')
            ->get();

        $labels = [];
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->format('Y-m-d');
            $labels[] = $d;
            $series[$d] = 0;
        }
        foreach ($rows as $r) {
            $series[$r->date] = (int) $r->total;
        }

        return response()->json([
            'total_games' => (int) $total_games,
            'active_players_last_days' => (int) $active_players,
            'common_victories' => [
                'wins' => (int) $wins,
                'capotes' => (int) $capotes,
                'flags' => (int) $flags,
            ],
            'global_records' => [
                'top_scores' => $topScores,
                'top_winners' => $topWinners,
                'longest_games' => $longestGames,
            ],
            'game_type_distribution' => $types,
            'average_statistics' => [
                'avg_points_per_game' => $avg_points,
                'avg_game_duration_seconds' => $avg_duration,
            ],
            'trends' => [
                'labels' => $labels,
                'data' => array_values($series),
            ],
        ]);
    }
}
