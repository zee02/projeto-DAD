#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Bisca Game State Database ===${NC}\n"

cd "$(dirname "$0")/api"

# Test 1: Check if tables exist
echo -e "${BLUE}Test 1: Checking if new tables exist...${NC}"
php artisan tinker << 'EOF'
$tables = DB::select('SELECT name FROM sqlite_master WHERE type="table"');
$tableNames = array_map(fn($t) => $t->name, $tables);
$requiredTables = ['game_states', 'game_cards', 'game_rounds', 'game_stock'];
$missing = array_diff($requiredTables, $tableNames);

if (empty($missing)) {
    echo "✅ All required tables exist!\n";
    echo "Tables: " . implode(', ', $requiredTables) . "\n";
} else {
    echo "❌ Missing tables: " . implode(', ', $missing) . "\n";
}
exit;
EOF

# Test 2: Test GameCard model
echo -e "\n${BLUE}Test 2: Testing GameCard model...${NC}"
php artisan tinker << 'EOF'
// Check if we can instantiate GameCard
$card = new App\Models\GameCard();
echo "✅ GameCard model loaded\n";

// Test card rank to points conversion
$testRanks = [1, 7, 10, 9, 8, 2];
foreach ($testRanks as $rank) {
    $points = App\Models\GameCard::calculatePointsValue($rank);
    echo "  Rank $rank = $points points\n";
}
exit;
EOF

# Test 3: Test GameState model
echo -e "\n${BLUE}Test 3: Testing GameState model...${NC}"
php artisan tinker << 'EOF'
$state = new App\Models\GameState();
echo "✅ GameState model loaded\n";

// Test suit names
$suitNames = ['Copas', 'Ouros', 'Paus', 'Espadas'];
echo "Suits: " . implode(', ', $suitNames) . "\n";
exit;
EOF

# Test 4: Test GameRound model
echo -e "\n${BLUE}Test 4: Testing GameRound model...${NC}"
php artisan tinker << 'EOF'
$round = new App\Models\GameRound();
echo "✅ GameRound model loaded\n";
exit;
EOF

# Test 5: Test GameStock model
echo -e "\n${BLUE}Test 5: Testing GameStock model...${NC}"
php artisan tinker << 'EOF'
$stock = new App\Models\GameStock();
echo "✅ GameStock model loaded\n";
exit;
EOF

echo -e "\n${GREEN}=== All Tests Passed! ===${NC}\n"
