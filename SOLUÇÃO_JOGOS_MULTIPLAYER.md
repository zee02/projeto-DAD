# Como Resolver o Problema de Jogos Multiplayer Não Serem Guardados

## 🔍 Diagnóstico Completo Realizado

Verifiquei todos os componentes do sistema e encontrei que:

✅ **Base de dados** - Estrutura correta, tabela `games` existe com todos os campos
✅ **API Laravel** - Endpoint `/api/games` funciona perfeitamente (testado)
✅ **WebSocket** - Código de save implementado corretamente
✅ **Frontend** - Página de histórico busca jogos corretamente
✅ **Node.js** - Versão 20.13.1 suporta fetch nativo

## ⚠️ Problema Mais Provável

**O servidor WebSocket não está a correr** quando você joga os jogos multiplayer.

Os jogos multiplayer dependem do servidor WebSocket para:
1. Gerir o estado do jogo em tempo real
2. Comunicar entre os dois jogadores
3. **Guardar o jogo na base de dados quando termina**

Se o WebSocket não estiver a correr, os jogos podem até funcionar parcialmente (se usarem algum fallback), mas **nunca serão guardados**.

## 🚀 Solução: Como Executar o Projeto Completo

### Passo 1: Abrir 3 Terminais

#### Terminal 1 - API Laravel
```bash
cd api
php artisan serve
```

Deve ver:
```
Server started on http://localhost:8000
```

#### Terminal 2 - WebSocket Server
```bash
cd websockets
npm run dev
```

Deve ver:
```
Socket.io server running on port 3000
Waiting for connections...
```

#### Terminal 3 - Frontend Vue
```bash
cd frontend
npm run dev
```

Deve ver:
```
➜  Local:   http://localhost:5173/
```

### Passo 2: Testar

1. Abra http://localhost:5173/ em dois browsers diferentes (ou use janela normal + incógnito)
2. Faça login com dois utilizadores diferentes
3. Inicie um jogo multiplayer
4. Jogue até ao fim

### Passo 3: Verificar Logs do WebSocket

No **Terminal 2** (WebSocket), quando o jogo terminar, deve ver:

```
[handleGameEnd] ========================================
[handleGameEnd] Starting end game process for game game_XXXXX
[handleGameEnd] Match ID: XXX, Game type: 3
[handleGameEnd] Player 1: XXX (XX pts)
[handleGameEnd] Player 2: XXX (XX pts)
[handleGameEnd] Winner: player1
[handleGameEnd] ========================================
[saveGameToDatabase] Preparing to save game game_XXXXX
[saveGameToDatabase] Sending POST to http://localhost:8000/api/games
[saveGameToDatabase] Response received: 201 Created
[saveGameToDatabase] ✓ Game saved successfully! DB ID: XXXXX
```

✅ **Se vir isto, o jogo foi guardado com sucesso!**

❌ **Se NÃO vir isto**, significa que:
- O jogo não chegou ao fim corretamente, OU
- Há um erro no código que impede o save

### Passo 4: Verificar na Base de Dados

```bash
cd api
sqlite3 database/database.sqlite "SELECT id, type, status, match_id, player1_user_id, player2_user_id, player1_points, player2_points, began_at FROM games ORDER BY id DESC LIMIT 5;"
```

O seu jogo deve aparecer na lista.

### Passo 5: Verificar no Frontend

1. Vá para a página "Game History"
2. O jogo deve aparecer na lista

## 🐛 Se Ainda Não Funcionar

### Debug 1: Verificar Erros no WebSocket

Procure por mensagens de erro no Terminal 2 (WebSocket):
- `Error: ...`
- `Exception: ...`
- `Failed: ...`

### Debug 2: Verificar Conexão API

Teste manualmente se o WebSocket consegue aceder à API:

```bash
cd websockets
node test-game-save.js
```

Deve ver:
```
Response status: 201 Created
SUCCESS: { message: 'Game saved successfully', data: { ... } }
```

### Debug 3: Verificar Players Reais

```bash
cd api
# Ver últimos utilizadores registados
sqlite3 database/database.sqlite "SELECT id, nickname, email FROM users ORDER BY id DESC LIMIT 5;"

# Ver jogos desses utilizadores (substitua 123,124 pelos IDs reais)
sqlite3 database/database.sqlite "SELECT id, player1_user_id, player2_user_id, match_id, player1_points, player2_points FROM games WHERE player1_user_id IN (123,124) OR player2_user_id IN (123,124) ORDER BY id DESC;"
```

## 📝 Logs Melhorados

Adicionei logging detalhado em:
- `websockets/events/connection.js` função `saveGameToDatabase()`
- `websockets/events/connection.js` função `handleGameEnd()`

Agora você pode ver exatamente o que está a acontecer quando um jogo termina.

## 🎯 Checklist de Verificação

Antes de jogar um jogo multiplayer, confirme:

- [ ] API está a correr (`php artisan serve` no terminal 1)
- [ ] WebSocket está a correr (`npm run dev` no terminal 2)
- [ ] Frontend está a correr (`npm run dev` no terminal 3)
- [ ] Vê "Socket.io server running on port 3000" no terminal 2
- [ ] Vê "Server started on http://localhost:8000" no terminal 1
- [ ] Consegue abrir http://localhost:5173/ no browser

## 📋 Ficheiros Criados/Modificados

1. **TROUBLESHOOTING.md** - Guia detalhado de troubleshooting (em inglês)
2. **websockets/test-game-save.js** - Script de teste para verificar se o save funciona
3. **websockets/events/connection.js** - Melhorado com logging detalhado

## ✨ Resumo

O problema mais provável é que está a jogar sem o servidor WebSocket a correr. 

**Solução**: Executar os 3 servidores em simultâneo (API, WebSocket, Frontend) e verificar os logs do WebSocket quando os jogos terminam.

Se seguir os passos acima e ainda tiver problemas, verifique os logs detalhados que adicionei e envie-me a mensagem de erro que aparecer.
