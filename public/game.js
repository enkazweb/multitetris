// Socket.io bağlantısı
const socket = io();

// Ekranlar
const menuScreen = document.getElementById('menu-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const errorModal = document.getElementById('error-modal');

// Oyuncu bilgileri
let playerName = '';
let playerIndex = -1;
let roomCode = '';

// ==================== SES SİSTEMİ ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicPlaying = false;
let musicTimeout = null;
let audioInitialized = false;
let musicLoopCount = 0;
const MAX_MUSIC_LOOPS = 2;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  audioInitialized = true;
}

// Ses efekti oluşturucu
function playSound(frequency, duration, type = 'square', volume = 0.3) {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

// Döndürme sesi
function playRotateSound() {
  if (!audioCtx) return;
  playSound(600, 0.08, 'square', 0.2);
  setTimeout(() => playSound(800, 0.08, 'square', 0.15), 30);
}

// Yerleştirme sesi
function playDropSound() {
  if (!audioCtx) return;
  playSound(150, 0.15, 'square', 0.3);
  setTimeout(() => playSound(100, 0.1, 'square', 0.2), 50);
}

// Satır silme sesi
function playClearSound(lines) {
  if (!audioCtx) return;
  
  // Sweep efekti
  const sweepOsc = audioCtx.createOscillator();
  const sweepGain = audioCtx.createGain();
  sweepOsc.connect(sweepGain);
  sweepGain.connect(audioCtx.destination);
  sweepOsc.type = 'sawtooth';
  sweepOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
  sweepOsc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.2);
  sweepGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  sweepGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  sweepOsc.start(audioCtx.currentTime);
  sweepOsc.stop(audioCtx.currentTime + 0.3);
  
  // Çoklu satır için ekstra sesler
  if (lines >= 2) {
    setTimeout(() => {
      playSound(523, 0.1, 'square', 0.2);
      setTimeout(() => playSound(659, 0.1, 'square', 0.2), 50);
      setTimeout(() => playSound(784, 0.15, 'square', 0.25), 100);
    }, 150);
  }
  
  if (lines >= 4) {
    // TETRIS! - Özel fanfare
    setTimeout(() => {
      const tetrisNotes = [523, 659, 784, 1047];
      tetrisNotes.forEach((note, i) => {
        setTimeout(() => playSound(note, 0.2, 'square', 0.3), i * 80);
      });
    }, 250);
  }
}

// Game over sesi
function playGameOverSound() {
  if (!audioCtx) return;
  const notes = [400, 350, 300, 250, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => playSound(freq, 0.3, 'sawtooth', 0.2), i * 150);
  });
}

// Tetris müziği
const musicNotes = [
  { note: 659, dur: 0.4 }, { note: 494, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 587, dur: 0.4 }, { note: 523, dur: 0.2 }, { note: 494, dur: 0.2 },
  { note: 440, dur: 0.4 }, { note: 440, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 659, dur: 0.4 }, { note: 587, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 494, dur: 0.6 }, { note: 523, dur: 0.2 }, { note: 587, dur: 0.4 },
  { note: 659, dur: 0.4 }, { note: 523, dur: 0.4 }, { note: 440, dur: 0.4 },
  { note: 440, dur: 0.4 }, { note: 0, dur: 0.4 },
  { note: 587, dur: 0.6 }, { note: 698, dur: 0.2 }, { note: 880, dur: 0.4 },
  { note: 784, dur: 0.2 }, { note: 698, dur: 0.2 }, { note: 659, dur: 0.6 },
  { note: 523, dur: 0.2 }, { note: 659, dur: 0.4 }, { note: 587, dur: 0.2 },
  { note: 523, dur: 0.2 }, { note: 494, dur: 0.4 }, { note: 494, dur: 0.2 },
  { note: 523, dur: 0.2 }, { note: 587, dur: 0.4 }, { note: 659, dur: 0.4 },
  { note: 523, dur: 0.4 }, { note: 440, dur: 0.4 }, { note: 440, dur: 0.4 },
  { note: 0, dur: 0.4 }
];

let currentNoteIndex = 0;

function playMusic() {
  if (!audioCtx || !musicPlaying) return;
  
  const { note, dur } = musicNotes[currentNoteIndex];
  
  if (note > 0) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = note;
    oscillator.type = 'square';
    
    const volume = 0.12;
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime + dur * 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur * 0.9);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + dur);
  }
  
  currentNoteIndex++;
  
  if (currentNoteIndex >= musicNotes.length) {
    currentNoteIndex = 0;
    musicLoopCount++;
    
    if (musicLoopCount >= MAX_MUSIC_LOOPS) {
      stopMusic();
      return;
    }
  }
  
  musicTimeout = setTimeout(playMusic, dur * 1000);
}

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  currentNoteIndex = 0;
  musicLoopCount = 0;
  playMusic();
}

function stopMusic() {
  musicPlaying = false;
  if (musicTimeout) {
    clearTimeout(musicTimeout);
    musicTimeout = null;
  }
}

// ==================== TETRIS OYUN KODU ====================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 22;
const MINI_BLOCK_SIZE = 11;

const COLORS = [
  null,
  '#00f5ff', // I
  '#ffd93d', // O
  '#9b59b6', // T
  '#6bcb77', // S
  '#ff6b6b', // Z
  '#4d96ff', // J
  '#ff9f43'  // L
];

const PIECES = [
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[0,4,4],[4,4,0]],
  [[5,5,0],[0,5,5]],
  [[6,0,0],[6,6,6]],
  [[0,0,7],[7,7,7]]
];

// Oyun durumları
let myCanvas, myCtx;
let opponentCanvas, opponentCtx;
let nextCanvas, nextCtx;
let myBoard = [];
let opponentBoard = [];
let currentPiece = null;
let currentPos = { x: 0, y: 0 };
let nextPieces = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let dropInterval = 1000;
let lastDrop = 0;
let gameSeed = 0;
let pieceIndex = 0;

// Satır silme efekti için
let clearingLines = [];
let clearAnimationFrame = 0;
let isClearing = false;

// Seeded random
function seededRandom() {
  gameSeed = (gameSeed * 9301 + 49297) % 233280;
  return gameSeed / 233280;
}

function createBoard() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

function getNextPiece() {
  const idx = Math.floor(seededRandom() * PIECES.length);
  pieceIndex++;
  return PIECES[idx].map(row => [...row]);
}

function resetPiece() {
  currentPiece = nextPieces.shift();
  nextPieces.push(getNextPiece());
  currentPos = {
    x: Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2),
    y: 0
  };
  
  if (collision()) {
    gameOver = true;
    stopMusic(); // Müziği durdur
    playGameOverSound(); // Game over sesi
    socket.emit('gameOver', { score });
    
    // Bekleme ekranını göster
    document.getElementById('waiting-score-value').textContent = score;
    document.getElementById('waiting-overlay').classList.remove('hidden');
  }
}

function collision(px = currentPos.x, py = currentPos.y, piece = currentPiece) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const newX = px + x;
        const newY = py + y;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        if (newY >= 0 && myBoard[newY] && myBoard[newY][newX]) return true;
      }
    }
  }
  return false;
}

function merge() {
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        const boardY = currentPos.y + y;
        if (boardY >= 0) {
          myBoard[boardY][currentPos.x + x] = currentPiece[y][x];
        }
      }
    }
  }
}

function drawMyBoard() {
  drawBoard(myCtx, myBoard, BLOCK_SIZE, true);
}

function findFullLines() {
  const fullLines = [];
  for (let y = 0; y < ROWS; y++) {
    let isFull = true;
    for (let x = 0; x < COLS; x++) {
      if (myBoard[y][x] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      fullLines.push(y);
    }
  }
  return fullLines;
}

function removeLinesFromBoard(linesToRemove) {
  // Satırları yukarıdan aşağıya sırala
  linesToRemove.sort((a, b) => a - b);
  
  // Yeni board oluştur
  const newBoard = [];
  
  // Silinecek satırlar hariç tüm satırları kopyala
  for (let y = 0; y < ROWS; y++) {
    if (!linesToRemove.includes(y)) {
      // Deep copy - her hücreyi ayrı ayrı kopyala
      const newRow = [];
      for (let x = 0; x < COLS; x++) {
        newRow.push(myBoard[y][x]);
      }
      newBoard.push(newRow);
    }
  }
  
  // Üste boş satırlar ekle
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  
  // Board'u güncelle - myBoard'u tamamen yeniden ata
  for (let y = 0; y < ROWS; y++) {
    myBoard[y] = newBoard[y];
  }
}

function clearLinesWithAnimation() {
  const fullLines = findFullLines();
  
  if (fullLines.length > 0) {
    isClearing = true;
    clearingLines = [...fullLines];
    clearAnimationFrame = 0;
    playClearSound(fullLines.length);
    
    const linesToClear = [...fullLines];
    const lineCount = linesToClear.length;
    
    const animateClear = () => {
      clearAnimationFrame++;
      
      if (clearAnimationFrame <= 10) {
        drawMyBoard();
        requestAnimationFrame(animateClear);
      } else {
        removeLinesFromBoard(linesToClear);
        
        const points = [0, 100, 300, 500, 800];
        score += points[lineCount];
        document.getElementById('my-score').textContent = score;
        
        isClearing = false;
        clearingLines = [];
        resetPiece();
        sendGameUpdate();
      }
    };
    
    animateClear();
    return true;
  }
  return false;
}

function rotate(piece) {
  return piece[0].map((_, i) => piece.map(row => row[i]).reverse());
}

function moveLeft() {
  if (isClearing) return;
  if (!collision(currentPos.x - 1, currentPos.y)) {
    currentPos.x--;
    sendGameUpdate();
  }
}

function moveRight() {
  if (isClearing) return;
  if (!collision(currentPos.x + 1, currentPos.y)) {
    currentPos.x++;
    sendGameUpdate();
  }
}

function moveDown() {
  if (isClearing) return false;
  if (!collision(currentPos.x, currentPos.y + 1)) {
    currentPos.y++;
    sendGameUpdate();
    return true;
  }
  return false;
}

function rotatePiece() {
  if (isClearing) return;
  const rotated = rotate(currentPiece);
  let kick = 0;
  
  if (collision(currentPos.x, currentPos.y, rotated)) {
    kick = currentPos.x > COLS / 2 ? -1 : 1;
  }
  
  if (!collision(currentPos.x + kick, currentPos.y, rotated)) {
    currentPiece = rotated;
    currentPos.x += kick;
    playRotateSound();
    sendGameUpdate();
  }
}

function drop() {
  if (isClearing) return;
  if (!moveDown()) {
    playDropSound();
    merge();
    if (!clearLinesWithAnimation()) {
      resetPiece();
      sendGameUpdate();
    }
  }
}

function drawBoard(ctx, board, blockSize, showPiece = false) {
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * blockSize, 0);
    ctx.lineTo(x * blockSize, ROWS * blockSize);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * blockSize);
    ctx.lineTo(COLS * blockSize, y * blockSize);
    ctx.stroke();
  }
  
  // Board blokları
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y] && board[y][x]) {
        // Satır silme animasyonu (sadece kendi board'ımda)
        if (showPiece && isClearing && clearingLines.includes(y)) {
          const flash = Math.sin(clearAnimationFrame * 0.8) > 0;
          if (flash) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = '#e94560';
          }
          ctx.fillRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
        } else {
          ctx.fillStyle = COLORS[board[y][x]];
          ctx.fillRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
        }
      }
    }
  }
  
  // Satır silme efekti - parlama çizgisi (sadece kendi board'ımda)
  if (showPiece && isClearing) {
    const progress = clearAnimationFrame / 10;
    clearingLines.forEach(lineY => {
      const gradient = ctx.createLinearGradient(0, lineY * blockSize, ctx.canvas.width, lineY * blockSize);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(Math.max(0, progress - 0.2), 'rgba(255,255,255,0)');
      gradient.addColorStop(progress, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(Math.min(1, progress + 0.2), 'rgba(255,255,255,0)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, lineY * blockSize, ctx.canvas.width, blockSize);
    });
  }
  
  // Mevcut parça (sadece kendi board'ımda ve animasyon yokken)
  if (showPiece && currentPiece && !isClearing) {
    for (let y = 0; y < currentPiece.length; y++) {
      for (let x = 0; x < currentPiece[y].length; x++) {
        if (currentPiece[y][x]) {
          ctx.fillStyle = COLORS[currentPiece[y][x]];
          ctx.fillRect(
            (currentPos.x + x) * blockSize + 1,
            (currentPos.y + y) * blockSize + 1,
            blockSize - 2,
            blockSize - 2
          );
        }
      }
    }
  }
}

function drawNextPiece() {
  if (!nextCtx || !nextPieces[0]) return;
  
  const size = 18;
  nextCtx.fillStyle = '#0a0a14';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  const piece = nextPieces[0];
  const offsetX = (4 - piece[0].length) / 2;
  const offsetY = (4 - piece.length) / 2;
  
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        nextCtx.fillStyle = COLORS[piece[y][x]];
        nextCtx.fillRect(
          (offsetX + x) * size + 1,
          (offsetY + y) * size + 1,
          size - 2,
          size - 2
        );
      }
    }
  }
}

function sendGameUpdate() {
  socket.emit('gameUpdate', {
    board: myBoard,
    score,
    currentPiece,
    currentPos
  });
}

function gameLoop(time) {
  if (!gameOver && gameStarted) {
    // Satır silme animasyonu sırasında drop çağırma
    if (!isClearing && time - lastDrop > dropInterval) {
      drop();
      lastDrop = time;
    }
    
    drawBoard(myCtx, myBoard, BLOCK_SIZE, true);
    drawNextPiece();
    requestAnimationFrame(gameLoop);
  }
}

function initGame(seed) {
  gameSeed = seed;
  pieceIndex = 0;
  myBoard = createBoard();
  opponentBoard = createBoard();
  score = 0;
  gameOver = false;
  gameStarted = true;
  dropInterval = 1000;
  lastDrop = 0;
  
  // Ses sistemini başlat
  initAudio();
  startMusic();
  
  // İlk parçaları oluştur
  nextPieces = [getNextPiece(), getNextPiece()];
  
  document.getElementById('my-score').textContent = '0';
  document.getElementById('opponent-score').textContent = '0';
  document.getElementById('opponent-status').classList.remove('show');
  
  resetPiece();
  requestAnimationFrame(gameLoop);
}

// ==================== SOCKET.IO EVENT'LERİ ====================

socket.on('roomCreated', (data) => {
  roomCode = data.roomCode;
  playerIndex = data.playerIndex;
  document.getElementById('display-room-code').textContent = roomCode;
  document.getElementById('ready-btn').disabled = false;
  document.getElementById('ready-btn').textContent = '✓ HAZIRIM';
  showScreen('lobby');
  updatePlayerSlots([{ name: playerName, ready: false }]);
});

socket.on('roomJoined', (data) => {
  roomCode = data.roomCode;
  playerIndex = data.playerIndex;
  document.getElementById('display-room-code').textContent = roomCode;
  document.getElementById('ready-btn').disabled = false;
  document.getElementById('ready-btn').textContent = '✓ HAZIRIM';
  showScreen('lobby');
});

socket.on('playerUpdate', (data) => {
  updatePlayerSlots(data.players);
});

socket.on('gameStart', (data) => {
  showScreen('game');
  setupCanvas();
  
  const players = document.querySelectorAll('.player-slot .player-name');
  const myName = playerIndex === 0 ? players[0]?.textContent : players[1]?.textContent;
  const oppName = playerIndex === 0 ? players[1]?.textContent : players[0]?.textContent;
  
  document.getElementById('my-name').textContent = myName || 'Ben';
  document.getElementById('opponent-name').textContent = oppName || 'Rakip';
  document.getElementById('opponent-name-side').textContent = oppName || 'Rakip';
  
  initGame(data.seed);
});

socket.on('opponentUpdate', (data) => {
  opponentBoard = data.board || createBoard();
  document.getElementById('opponent-score').textContent = data.score || 0;
  document.getElementById('opponent-score-side').textContent = data.score || 0;
  
  // Rakip board'ını çiz (parça dahil)
  if (opponentCtx) {
    drawBoard(opponentCtx, opponentBoard, MINI_BLOCK_SIZE, false);
    
    // Rakibin mevcut parçasını çiz
    if (data.currentPiece && data.currentPos) {
      for (let y = 0; y < data.currentPiece.length; y++) {
        for (let x = 0; x < data.currentPiece[y].length; x++) {
          if (data.currentPiece[y][x]) {
            opponentCtx.fillStyle = COLORS[data.currentPiece[y][x]];
            opponentCtx.fillRect(
              (data.currentPos.x + x) * MINI_BLOCK_SIZE + 1,
              (data.currentPos.y + y) * MINI_BLOCK_SIZE + 1,
              MINI_BLOCK_SIZE - 2,
              MINI_BLOCK_SIZE - 2
            );
          }
        }
      }
    }
  }
});

socket.on('opponentGameOver', (data) => {
  document.getElementById('opponent-status').textContent = 'OYUN BİTTİ';
  document.getElementById('opponent-status').classList.add('show');
});

socket.on('gameEnd', (data) => {
  gameStarted = false;
  
  // Bekleme ekranını gizle
  document.getElementById('waiting-overlay').classList.add('hidden');
  
  const isWinner = data.winner === playerIndex;
  const isDraw = data.winner === -1;
  
  const title = document.getElementById('result-title');
  if (isDraw) {
    title.textContent = 'BERABERE!';
    title.className = '';
  } else if (isWinner) {
    title.textContent = '🏆 KAZANDIN!';
    title.className = 'winner';
  } else {
    title.textContent = 'KAYBETTİN';
    title.className = 'loser';
  }
  
  document.getElementById('result-p1-name').textContent = data.scores[0].name;
  document.getElementById('result-p1-score').textContent = data.scores[0].score;
  document.getElementById('result-p2-name').textContent = data.scores[1].name;
  document.getElementById('result-p2-score').textContent = data.scores[1].score;
  
  showScreen('result');
});

socket.on('resetGame', () => {
  document.getElementById('waiting-overlay').classList.add('hidden');
  showScreen('lobby');
  document.getElementById('ready-btn').disabled = false;
  document.getElementById('ready-btn').textContent = '✓ HAZIRIM';
});

socket.on('opponentLeft', () => {
  showError('Rakip oyundan ayrıldı!');
  showScreen('menu');
});

socket.on('error', (message) => {
  showError(message);
});

// ==================== UI FONKSİYONLARI ====================

function showScreen(screen) {
  menuScreen.classList.add('hidden');
  lobbyScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  
  switch(screen) {
    case 'menu': menuScreen.classList.remove('hidden'); break;
    case 'lobby': lobbyScreen.classList.remove('hidden'); break;
    case 'game': gameScreen.classList.remove('hidden'); break;
    case 'result': resultScreen.classList.remove('hidden'); break;
  }
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  errorModal.classList.remove('hidden');
}

function updatePlayerSlots(players) {
  const slot1 = document.getElementById('player1-slot');
  const slot2 = document.getElementById('player2-slot');
  
  if (players[0]) {
    slot1.querySelector('.player-name').textContent = players[0].name;
    slot1.querySelector('.player-status').textContent = players[0].ready ? '✓' : '';
    slot1.classList.toggle('ready', players[0].ready);
  } else {
    slot1.querySelector('.player-name').textContent = 'Bekleniyor...';
    slot1.querySelector('.player-status').textContent = '';
    slot1.classList.remove('ready');
  }
  
  if (players[1]) {
    slot2.querySelector('.player-name').textContent = players[1].name;
    slot2.querySelector('.player-status').textContent = players[1].ready ? '✓' : '';
    slot2.classList.toggle('ready', players[1].ready);
  } else {
    slot2.querySelector('.player-name').textContent = 'Bekleniyor...';
    slot2.querySelector('.player-status').textContent = '';
    slot2.classList.remove('ready');
  }
}

function setupCanvas() {
  myCanvas = document.getElementById('my-canvas');
  myCtx = myCanvas.getContext('2d');
  myCanvas.width = COLS * BLOCK_SIZE;
  myCanvas.height = ROWS * BLOCK_SIZE;
  
  opponentCanvas = document.getElementById('opponent-canvas');
  opponentCtx = opponentCanvas.getContext('2d');
  opponentCanvas.width = COLS * MINI_BLOCK_SIZE;
  opponentCanvas.height = ROWS * MINI_BLOCK_SIZE;
  
  nextCanvas = document.getElementById('next-canvas');
  nextCtx = nextCanvas.getContext('2d');
  nextCanvas.width = 4 * 18;
  nextCanvas.height = 4 * 18;
}

// ==================== EVENT LİSTENER'LAR ====================

// Oda oluştur
document.getElementById('create-room-btn').addEventListener('click', () => {
  playerName = document.getElementById('player-name').value.trim() || 'Oyuncu';
  socket.emit('createRoom', playerName);
});

// Odaya katıl
document.getElementById('join-room-btn').addEventListener('click', () => {
  playerName = document.getElementById('player-name').value.trim() || 'Oyuncu';
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  
  if (code.length !== 6) {
    showError('Geçerli bir oda kodu girin!');
    return;
  }
  
  socket.emit('joinRoom', { roomCode: code, playerName });
});

// Hazır
document.getElementById('ready-btn').addEventListener('click', (e) => {
  socket.emit('ready');
  e.target.disabled = true;
  e.target.textContent = 'BEKLENİYOR...';
});

// Kodu kopyala
document.getElementById('copy-code-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode);
  document.getElementById('copy-code-btn').textContent = '✓ Kopyalandı!';
  setTimeout(() => {
    document.getElementById('copy-code-btn').textContent = '📋 Kodu Kopyala';
  }, 2000);
});

// Kod kutusuna tıklayınca kopyala
document.getElementById('display-room-code').addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode);
  const codeDisplay = document.getElementById('display-room-code');
  const originalText = codeDisplay.textContent;
  codeDisplay.textContent = '✓ KOPYALANDİ!';
  codeDisplay.style.fontSize = '24px';
  setTimeout(() => {
    codeDisplay.textContent = originalText;
    codeDisplay.style.fontSize = '42px';
  }, 1000);
});

// Yeniden oyna
document.getElementById('play-again-btn').addEventListener('click', () => {
  socket.emit('playAgain');
});

// Ana menü
document.getElementById('back-menu-btn').addEventListener('click', () => {
  location.reload();
});

// Hata kapat
document.getElementById('error-close-btn').addEventListener('click', () => {
  errorModal.classList.add('hidden');
});

// Oyun kontrolleri
document.getElementById('btn-left').addEventListener('click', () => gameStarted && !gameOver && !isClearing && moveLeft());
document.getElementById('btn-right').addEventListener('click', () => gameStarted && !gameOver && !isClearing && moveRight());
document.getElementById('btn-down').addEventListener('click', () => gameStarted && !gameOver && !isClearing && drop());
document.getElementById('btn-rotate').addEventListener('click', () => gameStarted && !gameOver && !isClearing && rotatePiece());

// Klavye
document.addEventListener('keydown', (e) => {
  if (!gameStarted || gameOver || isClearing) return;
  
  switch(e.key) {
    case 'ArrowLeft': moveLeft(); e.preventDefault(); break;
    case 'ArrowRight': moveRight(); e.preventDefault(); break;
    case 'ArrowDown': drop(); e.preventDefault(); break;
    case 'ArrowUp': rotatePiece(); e.preventDefault(); break;
  }
});

// Touch (canvas)
let touchStartX = 0;
let touchStartY = 0;

document.getElementById('my-canvas')?.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.getElementById('my-canvas')?.addEventListener('touchend', (e) => {
  if (!gameStarted || gameOver || isClearing) return;
  
  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;
  
  if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
    rotatePiece();
  } else if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 30) moveRight();
    else if (diffX < -30) moveLeft();
  } else {
    if (diffY > 30) drop();
  }
});

// Enter ile odaya katıl
document.getElementById('room-code-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('join-room-btn').click();
  }
});
