const CONFIG = {
    players: [
      { name: 'Blue', color: '#0ea5e9' },
      { name: 'Red', color: '#ef4444' }
    ],
    board: {
      size: 100,
      special: {
        3: { type: 'move', value: 10, text: 'Ladder: +10' },
        16: { type: 'move', value: -12, text: 'Hole: -12' },
        25: { type: 'card', cardId: 0, text: 'Draw a card' },
        72: { type: 'move', value: 10, text: 'Boost +10' },
        99: { type: 'goal', text: 'Finish!' }
      }
    },
    cards: [
      { text: 'Advance 5', action: { type: 'move', value: 5 } },
      { text: 'Go back 3', action: { type: 'move', value: -3 } },
      { text: 'Swap with next player', action: { type: 'swap' } }
    ],
    diceSides: 6
  };
  
  const state = {
    players: [],
    turn: 0,
    boardSize: CONFIG.board.size,
    logEl: null,
    isEnded: false
  };
  
  document.addEventListener('DOMContentLoaded', init);
  
  function init() {
    state.logEl = document.getElementById('log');
    state.boardEl = document.getElementById('board');
    document.getElementById('playerCount').textContent = CONFIG.players.length;
    document.getElementById('diceSides').textContent = CONFIG.diceSides;
    document.getElementById('cellsCount').textContent = CONFIG.board.size;
  
    createGrid(10, 10);
    state.players = CONFIG.players.map((p, i) => ({ ...p, pos: 0, id: i }));
    renderPlayers();
    renderCards();
    log('Game ready — ' + state.players.length + ' players');
    updateBoard();
  
    document.getElementById('rollBtn').addEventListener('click', rollDice);
  }
  
  function createGrid(cols, rows) {
    const board = state.boardEl;
    board.innerHTML = '';
    for (let i = 0; i < cols * rows; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.innerHTML = `<span style="position:absolute;top:4px;left:4px;font-size:10px;opacity:0.6;">${i}</span>`;
      board.appendChild(cell);
    }
  }
  
  function renderPlayers() {
    const el = document.getElementById('players');
    el.innerHTML = '';
    state.players.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = `<div class='token' style='background:${p.color}'>${p.name[0]}</div> ${p.name} (pos: ${p.pos})`;
      el.appendChild(div);
    });
  }
  
  function renderCards() {
    const el = document.getElementById('cardsList');
    el.innerHTML = CONFIG.cards.map((c, i) => `<div>${i + 1}. ${c.text}</div>`).join('');
  }
  
  function log(msg) {
    state.logEl.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}<br>` + state.logEl.innerHTML;
  }
  
  function rollDice() {
    if (state.isEnded) return log('Game ended.');
    const player = state.players[state.turn];
    const roll = Math.floor(Math.random() * CONFIG.diceSides) + 1;
    document.getElementById('diceResult').textContent = roll;
    log(`${player.name} rolled ${roll}`);
    movePlayer(player, roll);
    state.turn = (state.turn + 1) % state.players.length;
  }
  
  function movePlayer(player, steps) {
    const prev = player.pos;
    player.pos = Math.min(state.boardSize - 1, player.pos + steps);
    log(`${player.name} moves from ${prev} → ${player.pos}`);
    updateBoard();
    handleCell(player);
  }
  
  function handleCell(player) {
    const special = CONFIG.board.special[player.pos];
    if (!special) return;
    log(`${player.name} landed on ${special.text}`);
    if (special.type === 'move') movePlayer(player, special.value);
    else if (special.type === 'card') drawCard(player, special.cardId);
    else if (special.type === 'goal') {
      log(`${player.name} wins the game! 🎉`);
      state.isEnded = true;
    }
  }
  
  function drawCard(player, id) {
    const card = CONFIG.cards[id || Math.floor(Math.random() * CONFIG.cards.length)];
    log(`${player.name} drew: ${card.text}`);
    if (card.action.type === 'move') movePlayer(player, card.action.value);
    else if (card.action.type === 'swap') swapPlayers(player);
  }
  
  function swapPlayers(player) {
    const other = state.players[(player.id + 1) % state.players.length];
    [player.pos, other.pos] = [other.pos, player.pos];
    log(`${player.name} swapped with ${other.name}`);
    updateBoard();
  }
  
  function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => c.innerHTML = `<span style='position:absolute;top:4px;left:4px;font-size:10px;opacity:0.6;'>${c.dataset.index}</span>`);
    Object.keys(CONFIG.board.special).forEach(i => {
      cells[i].classList.add('special');
    });
    state.players.forEach((p, i) => {
      const token = document.createElement('div');
      token.className = 'token';
      token.style.background = p.color;
      token.style.position = 'absolute';
      token.style.bottom = `${5 + i * 22}px`;
      token.style.left = '50%';
      token.style.transform = 'translateX(-50%)';
      token.textContent = p.name[0];
      cells[p.pos].appendChild(token);
    });
    renderPlayers();
  }
  