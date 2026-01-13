// ==================== VR MULTITETRIS ====================
// WebXR + A-Frame ile 3D Multiplayer Tetris
// Geliştiren: Cem YILDIRIM

const socket = io();

// ==================== OYUN SABİTLERİ ====================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 0.1; // VR'da 10cm bloklar

// Daha canlı ve parlak renkler
const COLORS = [
  null,
  '#00FFFF', // I - Parlak Cyan
  '#FFD700', // O - Altın Sarısı
  '#FF00FF', // T - Magenta
  '#00FF00', // S - Neon Yeşil
  '#FF3333', // Z - Parlak Kırmızı
  '#3366FF', // J - Elektrik Mavisi
  '#FF6600'  // L - Parlak Turuncu
];

// Blok iç renkleri (gradyan efekti için)
const COLORS_DARK = [
  null,
  '#008888',
  '#997700',
  '#880088',
  '#008800',
  '#881111',
  '#112288',
  '#884400'
];

const PIECES = [
  [[1,1,1,1]],           // I
  [[2,2],[2,2]],         // O
  [[0,3,0],[3,3,3]],     // T
  [[0,4,4],[4,4,0]],     // S
  [[5,5,0],[0,5,5]],     // Z
  [[6,0,0],[6,6,6]],     // J
  [[0,0,7],[7,7,7]]      // L
];

// ==================== SES SİSTEMİ ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicPlaying = false;
let musicTimeout = null;
let musicLoopCount = 0;
const MAX_MUSIC_LOOPS = 999;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Temel ses oluşturucu
function playTone(frequency, duration, type = 'square', volume = 0.3, delay = 0) {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  const startTime = audioCtx.currentTime + delay;
  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// 🔊 Döndürme sesi
function playRotateSound() {
  if (!audioCtx) return;
  playTone(600, 0.05, 'square', 0.2);
  playTone(900, 0.05, 'square', 0.15, 0.02);
}

// 🔊 Hareket sesi
function playMoveSound() {
  if (!audioCtx) return;
  playTone(200, 0.02, 'square', 0.08);
}

// 🔊 Yerleştirme sesi
function playDropSound() {
  if (!audioCtx) return;
  playTone(120, 0.1, 'square', 0.3);
  playTone(80, 0.15, 'triangle', 0.2, 0.03);
}

// 🔊 Hard drop sesi
function playHardDropSound() {
  if (!audioCtx) return;
  playTone(80, 0.15, 'sawtooth', 0.35);
  playTone(150, 0.08, 'square', 0.25, 0.05);
}

// 🔊 Satır silme sesi - Arcade tarzı
function playClearSound(lines) {
  if (!audioCtx) return;
  
  // Hızlı sweep
  const notes = [523, 659, 784, 1047];
  notes.slice(0, lines).forEach((note, i) => {
    playTone(note, 0.1, 'square', 0.25, i * 0.05);
  });
  
  // Tetris bonus
  if (lines >= 4) {
    [1047, 1319, 1568, 2093].forEach((note, i) => {
      playTone(note, 0.15, 'square', 0.3, 0.2 + i * 0.08);
    });
  }
}

// 🔊 Game Over sesi
function playGameOverSound() {
  if (!audioCtx) return;
  [400, 350, 300, 250, 200].forEach((freq, i) => {
    playTone(freq, 0.3, 'sawtooth', 0.2, i * 0.15);
  });
}

// 🎵 ARCADE MÜZİK - Klasik Tetris (Korobeiniki) - Normal tempo
const korobeinikiNotes = [
  // Ana tema - Normal tempo
  { note: 659, dur: 0.4 }, { note: 494, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 587, dur: 0.4 }, { note: 523, dur: 0.2 }, { note: 494, dur: 0.2 },
  { note: 440, dur: 0.4 }, { note: 440, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 659, dur: 0.4 }, { note: 587, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 494, dur: 0.6 }, { note: 523, dur: 0.2 },
  { note: 587, dur: 0.4 }, { note: 659, dur: 0.4 },
  { note: 523, dur: 0.4 }, { note: 440, dur: 0.4 },
  { note: 440, dur: 0.4 }, { note: 0, dur: 0.4 },
  
  // İkinci bölüm
  { note: 587, dur: 0.6 }, { note: 698, dur: 0.2 },
  { note: 880, dur: 0.4 }, { note: 784, dur: 0.2 }, { note: 698, dur: 0.2 },
  { note: 659, dur: 0.6 }, { note: 523, dur: 0.2 },
  { note: 659, dur: 0.4 }, { note: 587, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 494, dur: 0.4 }, { note: 494, dur: 0.2 }, { note: 523, dur: 0.2 },
  { note: 587, dur: 0.4 }, { note: 659, dur: 0.4 },
  { note: 523, dur: 0.4 }, { note: 440, dur: 0.4 },
  { note: 440, dur: 0.4 }, { note: 0, dur: 0.4 }
];

// 🎵 RELAX MÜZİK - Ağır tempo ambient
const relaxMusicNotes = [
  // Yavaş ve sakin melodi
  { note: 262, dur: 0.8 }, { note: 330, dur: 0.8 }, { note: 392, dur: 0.8 }, { note: 330, dur: 0.8 },
  { note: 294, dur: 0.8 }, { note: 349, dur: 0.8 }, { note: 440, dur: 0.8 }, { note: 349, dur: 0.8 },
  { note: 262, dur: 0.8 }, { note: 392, dur: 0.8 }, { note: 523, dur: 1.2 }, { note: 0, dur: 0.4 },
  
  { note: 440, dur: 0.6 }, { note: 392, dur: 0.6 }, { note: 349, dur: 0.6 }, { note: 330, dur: 0.6 },
  { note: 294, dur: 0.8 }, { note: 262, dur: 1.2 }, { note: 0, dur: 0.8 },
  
  { note: 196, dur: 1.0 }, { note: 262, dur: 0.6 }, { note: 330, dur: 0.6 }, { note: 392, dur: 1.2 },
  { note: 349, dur: 0.8 }, { note: 330, dur: 0.8 }, { note: 294, dur: 1.6 }, { note: 0, dur: 0.8 },
  
  { note: 262, dur: 1.0 }, { note: 294, dur: 0.5 }, { note: 330, dur: 0.5 }, { note: 392, dur: 1.0 },
  { note: 440, dur: 0.8 }, { note: 392, dur: 0.8 }, { note: 330, dur: 1.6 }, { note: 0, dur: 1.0 }
];

let currentMusicNote = 0;
let isPlayingRelax = false;
const KOROBEINIKI_LOOPS = 2; // Korobeiniki 2 kez çalsın

function playMusic() {
  if (!audioCtx || !musicPlaying) return;
  
  // Hangi müzik çalıyor?
  const currentNotes = isPlayingRelax ? relaxMusicNotes : korobeinikiNotes;
  const { note, dur } = currentNotes[currentMusicNote];
  
  if (note > 0) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.value = note;
    
    if (isPlayingRelax) {
      // Relax müzik - Yumuşak sine wave
      osc.type = 'sine';
      const vol = 0.08;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur * 0.95);
      
      // Pad efekti (harmony)
      if (note > 200) {
        const pad = audioCtx.createOscillator();
        const padGain = audioCtx.createGain();
        pad.connect(padGain);
        padGain.connect(audioCtx.destination);
        pad.frequency.value = note * 1.5; // Beşli
        pad.type = 'sine';
        padGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        padGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur * 0.8);
        pad.start(audioCtx.currentTime);
        pad.stop(audioCtx.currentTime + dur);
      }
    } else {
      // Korobeiniki - Square wave (8-bit)
      osc.type = 'square';
      const vol = 0.12;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur * 0.95);
      
      // Bass
      if (currentMusicNote % 4 === 0 && note > 300) {
        const bass = audioCtx.createOscillator();
        const bassGain = audioCtx.createGain();
        bass.connect(bassGain);
        bassGain.connect(audioCtx.destination);
        bass.frequency.value = note / 4;
        bass.type = 'triangle';
        bassGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur * 0.5);
        bass.start(audioCtx.currentTime);
        bass.stop(audioCtx.currentTime + dur);
      }
    }
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }
  
  currentMusicNote++;
  
  // Döngü kontrolü
  if (currentMusicNote >= currentNotes.length) {
    currentMusicNote = 0;
    musicLoopCount++;
    
    // Korobeiniki 2 kez çaldıktan sonra relax müziğe geç
    if (!isPlayingRelax && musicLoopCount >= KOROBEINIKI_LOOPS) {
      isPlayingRelax = true;
      musicLoopCount = 0;
      console.log('🎵 Relax müziğe geçiliyor...');
    }
  }
  
  musicTimeout = setTimeout(playMusic, dur * 1000);
}

function startMusic() {
  if (musicPlaying) return;
  initAudio();
  musicPlaying = true;
  currentMusicNote = 0;
  musicLoopCount = 0;
  isPlayingRelax = false;
  playMusic();
}

function stopMusic() {
  musicPlaying = false;
  isPlayingRelax = false;
  if (musicTimeout) {
    clearTimeout(musicTimeout);
    musicTimeout = null;
  }
}

// ==================== OYUN DURUMU ====================
let playerName = '';
let opponentName = '';
let playerIndex = -1;
let roomCode = '';
let allPlayers = [];

let myBoard = [];
let opponentBoard = [];
let opponentCurrentPiece = null;
let opponentCurrentPos = { x: 0, y: 0 };
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

// VR Soft drop
let isSoftDropping = false;
const SOFT_DROP_INTERVAL = 50;
const NORMAL_DROP_INTERVAL = 1000;

// UI Elements
const uiOverlay = document.getElementById('ui-overlay');
const lobbyOverlay = document.getElementById('lobby-overlay');

// ==================== GELİŞMİŞ 3D BLOK OLUŞTURMA ====================
function create3DBlock(x, y, colorIndex, parentId, depth = BLOCK_SIZE * 0.8) {
  const parent = document.getElementById(parentId);
  if (!parent) return null;
  
  const blockEntity = document.createElement('a-entity');
  
  // Pozisyon hesapla
  const posX = (x - COLS / 2 + 0.5) * BLOCK_SIZE;
  const posY = (ROWS / 2 - y - 0.5) * BLOCK_SIZE;
  const posZ = depth / 2;
  
  blockEntity.setAttribute('position', `${posX} ${posY} ${posZ}`);
  blockEntity.classList.add('tetris-block');
  
  const color = COLORS[colorIndex];
  const darkColor = COLORS_DARK[colorIndex];
  const size = BLOCK_SIZE * 0.92;
  
  // Ana 3D kutu - Gerçek derinlikli
  const mainBox = document.createElement('a-box');
  mainBox.setAttribute('width', size);
  mainBox.setAttribute('height', size);
  mainBox.setAttribute('depth', depth);
  mainBox.setAttribute('material', `
    color: ${color}; 
    emissive: ${color}; 
    emissiveIntensity: 0.5;
    metalness: 0.4;
    roughness: 0.3
  `);
  
  // Üst parlak yüzey
  const topFace = document.createElement('a-plane');
  topFace.setAttribute('width', size * 0.8);
  topFace.setAttribute('height', size * 0.8);
  topFace.setAttribute('position', `0 0 ${depth / 2 + 0.002}`);
  topFace.setAttribute('material', `color: white; opacity: 0.35; transparent: true`);
  
  // İç gölge (derinlik için)
  const innerShadow = document.createElement('a-box');
  innerShadow.setAttribute('width', size * 0.65);
  innerShadow.setAttribute('height', size * 0.65);
  innerShadow.setAttribute('depth', depth * 0.4);
  innerShadow.setAttribute('position', `0 0 ${depth * 0.2}`);
  innerShadow.setAttribute('material', `color: ${darkColor}; emissive: ${darkColor}; emissiveIntensity: 0.3`);
  
  // Kenar glow
  const glow = document.createElement('a-box');
  glow.setAttribute('width', size * 1.08);
  glow.setAttribute('height', size * 1.08);
  glow.setAttribute('depth', depth * 0.15);
  glow.setAttribute('position', `0 0 -${depth * 0.4}`);
  glow.setAttribute('material', `color: ${color}; emissive: ${color}; emissiveIntensity: 1; opacity: 0.4; transparent: true`);
  
  blockEntity.appendChild(mainBox);
  blockEntity.appendChild(topFace);
  blockEntity.appendChild(innerShadow);
  blockEntity.appendChild(glow);
  
  parent.appendChild(blockEntity);
  return blockEntity;
}

function clearBlocks(parentId) {
  const parent = document.getElementById(parentId);
  if (!parent) return;
  
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function render3DBoard(board, blocksContainerId, blockDepth = BLOCK_SIZE * 0.8) {
  clearBlocks(blocksContainerId);
  
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y] && board[y][x]) {
        create3DBlock(x, y, board[y][x], blocksContainerId, blockDepth);
      }
    }
  }
}

function render3DCurrentPiece() {
  clearBlocks('my-current-piece');
  
  if (!currentPiece) return;
  
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        create3DBlock(
          currentPos.x + x, 
          currentPos.y + y, 
          currentPiece[y][x], 
          'my-current-piece'
        );
      }
    }
  }
}

// Rakip parçasını ayrı render et
function render3DOpponentPiece() {
  clearBlocks('opponent-current-piece');
  
  if (!opponentCurrentPiece) return;
  
  for (let y = 0; y < opponentCurrentPiece.length; y++) {
    for (let x = 0; x < opponentCurrentPiece[y].length; x++) {
      if (opponentCurrentPiece[y][x]) {
        create3DBlock(
          opponentCurrentPos.x + x, 
          opponentCurrentPos.y + y, 
          opponentCurrentPiece[y][x], 
          'opponent-current-piece',
          BLOCK_SIZE * 0.6
        );
      }
    }
  }
}

function render3DNextPiece() {
  clearBlocks('next-piece-blocks');
  
  // Sadece sıradaki parça
  if (nextPieces[0]) {
    renderSingleNextPiece(nextPieces[0], 'next-piece-blocks', 0.06, 0);
  }
}

// Rakibin sıradaki parçasını render et
function render3DOpponentNextPiece(piece) {
  clearBlocks('opponent-next-piece-blocks');
  
  if (piece) {
    renderSingleNextPiece(piece, 'opponent-next-piece-blocks', 0.06, 0);
  }
}

function renderSingleNextPiece(piece, containerId, size, yOffset) {
  const parent = document.getElementById(containerId);
  if (!parent || !piece) return;
  
  const offsetX = (4 - piece[0].length) / 2;
  const offsetY = (4 - piece.length) / 2;
  
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const blockEntity = document.createElement('a-entity');
        const posX = (x + offsetX - 2) * size;
        const posY = (2 - y - offsetY) * size + yOffset;
        
        blockEntity.setAttribute('position', `${posX} ${posY} 0.02`);
        blockEntity.classList.add('tetris-block');
        
        const color = COLORS[piece[y][x]];
        
        const box = document.createElement('a-box');
        box.setAttribute('width', size * 0.9);
        box.setAttribute('height', size * 0.9);
        box.setAttribute('depth', size * 0.7);
        box.setAttribute('material', `
          color: ${color}; 
          emissive: ${color}; 
          emissiveIntensity: 0.6;
          metalness: 0.4;
          roughness: 0.3
        `);
        
        blockEntity.appendChild(box);
        parent.appendChild(blockEntity);
      }
    }
  }
}

// ==================== OYUN MANTIĞI ====================
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

function resetPiece() {
  currentPiece = nextPieces.shift();
  nextPieces.push(getNextPiece());
  currentPos = {
    x: Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2),
    y: 0
  };
  
  if (collision()) {
    gameOver = true;
    stopMusic();
    playGameOverSound();
    socket.emit('gameOver', { score });
    showWaitingPanel(); // Rakip bekleniyor panelini göster
  }
  
  render3DNextPiece();
}

function showWaitingPanel() {
  const panel = document.getElementById('waiting-panel');
  const scoreText = document.getElementById('waiting-score-text');
  
  if (scoreText) {
    scoreText.setAttribute('value', `Skorun: ${score}`);
  }
  
  if (panel) {
    panel.setAttribute('visible', 'true');
  }
}

function hideWaitingPanel() {
  const panel = document.getElementById('waiting-panel');
  if (panel) {
    panel.setAttribute('visible', 'false');
  }
}

function rotate(piece) {
  return piece[0].map((_, i) => piece.map(row => row[i]).reverse());
}

function moveLeft() {
  if (isClearing) return;
  if (!collision(currentPos.x - 1, currentPos.y)) {
    currentPos.x--;
    playMoveSound();
    sendGameUpdate();
    render3DCurrentPiece();
  }
}

function moveRight() {
  if (isClearing) return;
  if (!collision(currentPos.x + 1, currentPos.y)) {
    currentPos.x++;
    playMoveSound();
    sendGameUpdate();
    render3DCurrentPiece();
  }
}

function moveDown() {
  if (isClearing) return false;
  if (!collision(currentPos.x, currentPos.y + 1)) {
    currentPos.y++;
    if (isSoftDropping) {
      score += 1;
      updateScoreDisplay();
    }
    sendGameUpdate();
    render3DCurrentPiece();
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
    render3DCurrentPiece();
  }
}

function hardDrop() {
  if (isClearing) return;
  
  let dropDistance = 0;
  while (!collision(currentPos.x, currentPos.y + 1)) {
    currentPos.y++;
    dropDistance++;
  }
  score += dropDistance * 2;
  updateScoreDisplay();
  playHardDropSound();
  
  merge();
  render3DBoard(myBoard, 'my-blocks');
  
  // Satır silme kontrolü
  const cleared = clearLines();
  if (!cleared) {
    resetPiece();
    render3DCurrentPiece();
    sendGameUpdate();
  }
}

function drop() {
  if (isClearing) return;
  
  if (!moveDown()) {
    playDropSound();
    merge();
    render3DBoard(myBoard, 'my-blocks');
    
    // Satır silme kontrolü
    const cleared = clearLines();
    if (!cleared) {
      resetPiece();
      render3DCurrentPiece();
      sendGameUpdate();
    }
  }
}

// ==================== SATIR SİLME - YAVAŞ ANİMASYONLU ====================
let isClearing = false;
let clearingLines = [];

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

function clearLines() {
  const fullLines = findFullLines();
  
  if (fullLines.length === 0) return false;
  
  // Animasyonlu satır silme başlat
  isClearing = true;
  clearingLines = [...fullLines];
  
  // Ses çal
  playClearSound(fullLines.length);
  
  // Puan hesapla
  const points = [0, 100, 300, 500, 800];
  const earnedPoints = points[fullLines.length] || 0;
  
  // Yavaş flash animasyonu
  let flashCount = 0;
  const totalFlashes = 6;
  const flashDelay = 120; // Her flash 120ms
  
  const doFlash = () => {
    if (flashCount >= totalFlashes) {
      // Animasyon bitti, satırları sil
      removeLinesFromBoard(fullLines);
      
      // Puan ekle
      score += earnedPoints;
      updateScoreDisplay();
      
      // Board'u yeniden render et
      render3DBoard(myBoard, 'my-blocks');
      
      // Yeni parça
      isClearing = false;
      clearingLines = [];
      resetPiece();
      render3DCurrentPiece();
      sendGameUpdate();
      return;
    }
    
    // Flash efekti
    const bg = document.getElementById('my-board-bg');
    if (bg) {
      if (flashCount % 2 === 0) {
        bg.setAttribute('material', 'color: #ffffff; opacity: 0.95; transparent: true');
      } else {
        bg.setAttribute('material', 'color: #0a0a14; opacity: 0.9; transparent: true');
      }
    }
    
    flashCount++;
    setTimeout(doFlash, flashDelay);
  };
  
  doFlash();
  return true;
}

function flashBoard(bgId) {
  const bg = document.getElementById(bgId);
  if (!bg) return;
  
  bg.setAttribute('material', 'color: #ffffff; opacity: 0.95; transparent: true');
  setTimeout(() => {
    bg.setAttribute('material', 'color: #0a0a14; opacity: 0.9; transparent: true');
  }, 80);
  setTimeout(() => {
    bg.setAttribute('material', 'color: #ffffff; opacity: 0.7; transparent: true');
  }, 160);
  setTimeout(() => {
    bg.setAttribute('material', 'color: #0a0a14; opacity: 0.9; transparent: true');
  }, 240);
}

function updateScoreDisplay() {
  const myScoreText = document.getElementById('my-score-text');
  if (myScoreText) {
    myScoreText.setAttribute('value', score.toString());
  }
}

function sendGameUpdate() {
  socket.emit('gameUpdate', {
    board: myBoard,
    score,
    currentPiece,
    currentPos,
    nextPiece: nextPieces[0] // Sıradaki parçayı da gönder
  });
}

function showGameOverPanel() {
  const panel = document.getElementById('game-over-panel');
  if (panel) {
    panel.setAttribute('visible', 'true');
  }
}

// ==================== OYUN DÖNGÜSÜ ====================
function gameLoop(time) {
  if (!gameOver && gameStarted) {
    // Satır silme animasyonu sırasında drop çağırma
    if (!isClearing && time - lastDrop > dropInterval) {
      drop();
      lastDrop = time;
    }
    requestAnimationFrame(gameLoop);
  }
}

function initGame(seed) {
  gameSeed = seed;
  pieceIndex = 0;
  myBoard = createBoard();
  opponentBoard = createBoard();
  opponentCurrentPiece = null;
  opponentCurrentPos = { x: 0, y: 0 };
  score = 0;
  gameOver = false;
  gameStarted = true;
  dropInterval = NORMAL_DROP_INTERVAL;
  lastDrop = 0;
  isClearing = false;
  clearingLines = [];
  
  nextPieces = [getNextPiece(), getNextPiece()];
  
  // Ses başlat
  initAudio();
  startMusic();
  
  updateScoreDisplay();
  document.getElementById('opponent-score-text')?.setAttribute('value', '0');
  
  // Board'ları temizle
  clearBlocks('my-blocks');
  clearBlocks('my-current-piece');
  clearBlocks('opponent-blocks');
  clearBlocks('opponent-current-piece');
  
  resetPiece();
  render3DCurrentPiece();
  render3DNextPiece();
  
  requestAnimationFrame(gameLoop);
}

// ==================== SOCKET.IO EVENT'LERİ ====================
socket.on('roomCreated', (data) => {
  roomCode = data.roomCode;
  playerIndex = data.playerIndex;
  document.getElementById('display-room-code').textContent = roomCode;
  showLobby();
  updatePlayerSlots([{ name: playerName, ready: false }]);
});

socket.on('roomJoined', (data) => {
  roomCode = data.roomCode;
  playerIndex = data.playerIndex;
  document.getElementById('display-room-code').textContent = roomCode;
  showLobby();
});

socket.on('playerUpdate', (data) => {
  allPlayers = data.players;
  updatePlayerSlots(data.players);
  
  // Rakip adını kaydet
  if (data.players.length === 2) {
    opponentName = playerIndex === 0 ? data.players[1].name : data.players[0].name;
  }
});

socket.on('gameStart', (data) => {
  hideAllOverlays();
  
  // İsimleri ayarla
  const myNameText = document.getElementById('my-name-text');
  const oppNameText = document.getElementById('opponent-name-text');
  
  if (myNameText) myNameText.setAttribute('value', playerName || 'Ben');
  if (oppNameText) oppNameText.setAttribute('value', opponentName || 'Rakip');
  
  initGame(data.seed);
});

// RAKİP CANLI GÜNCELLEME
socket.on('opponentUpdate', (data) => {
  // Board'u güncelle
  if (data.board) {
    opponentBoard = data.board;
    render3DBoard(opponentBoard, 'opponent-blocks', BLOCK_SIZE * 0.6);
  }
  
  // Rakibin mevcut parçasını güncelle
  if (data.currentPiece && data.currentPos) {
    opponentCurrentPiece = data.currentPiece;
    opponentCurrentPos = data.currentPos;
    render3DOpponentPiece();
  }
  
  // Rakibin sıradaki parçasını güncelle
  if (data.nextPiece) {
    render3DOpponentNextPiece(data.nextPiece);
  }
  
  // Rakip skorunu güncelle
  const oppScoreText = document.getElementById('opponent-score-text');
  if (oppScoreText) {
    oppScoreText.setAttribute('value', (data.score || 0).toString());
  }
});

socket.on('opponentGameOver', (data) => {
  console.log('Rakip oyunu kaybetti:', data.score);
  const oppStatus = document.getElementById('opponent-status-overlay');
  if (oppStatus) {
    oppStatus.setAttribute('visible', 'true');
  }
});

socket.on('gameEnd', (data) => {
  gameStarted = false;
  stopMusic();
  
  // Bekleme panelini gizle
  hideWaitingPanel();
  
  const isWinner = data.winner === playerIndex;
  const isDraw = data.winner === -1;
  
  const resultText = document.getElementById('result-text');
  const scoresText = document.getElementById('final-scores-text');
  const panel = document.getElementById('game-over-panel');
  
  if (resultText) {
    if (isDraw) {
      resultText.setAttribute('value', 'BERABERE!');
      resultText.setAttribute('color', '#ffd93d');
    } else if (isWinner) {
      resultText.setAttribute('value', 'KAZANDIN!');
      resultText.setAttribute('color', '#6bcb77');
    } else {
      resultText.setAttribute('value', 'KAYBETTIN');
      resultText.setAttribute('color', '#ff6b6b');
    }
  }
  
  if (scoresText) {
    scoresText.setAttribute('value', 
      `${data.scores[0].name}: ${data.scores[0].score}\n${data.scores[1].name}: ${data.scores[1].score}`
    );
  }
  
  if (panel) {
    panel.setAttribute('visible', 'true');
  }
});

socket.on('resetGame', () => {
  const panel = document.getElementById('game-over-panel');
  if (panel) panel.setAttribute('visible', 'false');
  const oppStatus = document.getElementById('opponent-status-overlay');
  if (oppStatus) oppStatus.setAttribute('visible', 'false');
  hideWaitingPanel();
  stopMusic();
  showLobby();
});

socket.on('opponentLeft', () => {
  stopMusic();
  alert('Rakip oyundan ayrıldı!');
  location.reload();
});

socket.on('error', (message) => {
  alert(message);
});

// ==================== UI FONKSİYONLARI ====================
function showLobby() {
  uiOverlay.classList.add('hidden');
  lobbyOverlay.classList.remove('hidden');
}

function hideAllOverlays() {
  uiOverlay.classList.add('hidden');
  lobbyOverlay.classList.add('hidden');
}

function updatePlayerSlots(players) {
  const slot1 = document.getElementById('player1-slot');
  const slot2 = document.getElementById('player2-slot');
  
  if (players[0]) {
    slot1.querySelector('.name').textContent = players[0].name;
    slot1.querySelector('.status').textContent = players[0].ready ? '✓' : '';
    slot1.classList.toggle('ready', players[0].ready);
  }
  
  if (players[1]) {
    slot2.querySelector('.name').textContent = players[1].name;
    slot2.querySelector('.status').textContent = players[1].ready ? '✓' : '';
    slot2.classList.toggle('ready', players[1].ready);
  }
}

// ==================== EVENT LISTENER'LAR ====================
document.getElementById('create-room-btn').addEventListener('click', () => {
  playerName = document.getElementById('player-name').value.trim() || 'VR Oyuncu';
  initAudio();
  socket.emit('createRoom', playerName);
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  playerName = document.getElementById('player-name').value.trim() || 'VR Oyuncu';
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  
  if (code.length !== 6) {
    alert('Geçerli bir oda kodu girin!');
    return;
  }
  
  initAudio();
  socket.emit('joinRoom', { roomCode: code, playerName });
});

document.getElementById('ready-btn').addEventListener('click', (e) => {
  socket.emit('ready');
  e.target.disabled = true;
  e.target.textContent = 'BEKLENİYOR...';
});

// ==================== VR KONTROLLER ====================
document.addEventListener('keydown', (e) => {
  if (!gameStarted || gameOver) return;
  
  switch(e.key) {
    case 'ArrowLeft': moveLeft(); break;
    case 'ArrowRight': moveRight(); break;
    case 'ArrowDown': 
      if (!isSoftDropping) {
        isSoftDropping = true;
        dropInterval = SOFT_DROP_INTERVAL;
        lastDrop = 0;
      }
      break;
    case 'ArrowUp': rotatePiece(); break;
    case ' ': hardDrop(); e.preventDefault(); break;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') {
    isSoftDropping = false;
    dropInterval = NORMAL_DROP_INTERVAL;
  }
});

// VR Controller
document.addEventListener('DOMContentLoaded', () => {
  const leftHand = document.getElementById('left-hand');
  if (leftHand) {
    let lastMoveTime = 0;
    const moveDelay = 120;
    
    leftHand.addEventListener('thumbstickmoved', (e) => {
      if (!gameStarted || gameOver) return;
      
      const now = Date.now();
      if (now - lastMoveTime < moveDelay) return;
      
      const x = e.detail.x;
      const y = e.detail.y;
      
      if (x < -0.5) { moveLeft(); lastMoveTime = now; }
      if (x > 0.5) { moveRight(); lastMoveTime = now; }
      
      if (y > 0.5) {
        if (!isSoftDropping) {
          isSoftDropping = true;
          dropInterval = SOFT_DROP_INTERVAL;
        }
      } else {
        if (isSoftDropping) {
          isSoftDropping = false;
          dropInterval = NORMAL_DROP_INTERVAL;
        }
      }
    });
    
    leftHand.addEventListener('triggerdown', () => {
      if (gameStarted && !gameOver) rotatePiece();
    });
  }
  
  const rightHand = document.getElementById('right-hand');
  if (rightHand) {
    rightHand.addEventListener('triggerdown', () => {
      if (gameStarted && !gameOver) hardDrop();
    });
    
    rightHand.addEventListener('abuttondown', () => {
      if (gameStarted && !gameOver) rotatePiece();
    });
  }
});

// ==================== 3D ARKA PLAN - YÜZEN TETRİS KÜPLERİ ====================
document.addEventListener('DOMContentLoaded', () => {
  createFloatingTetrisBlocks();
  createGridFloor();
  createAmbientParticles();
});

function createFloatingTetrisBlocks() {
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  // Büyük yüzen Tetris parçaları
  const floatingPieces = [
    { piece: PIECES[0], color: 1, pos: [-4, 3, -8], rot: [15, 45, 0], scale: 0.5 },
    { piece: PIECES[1], color: 2, pos: [4, 2, -7], rot: [-10, -30, 20], scale: 0.4 },
    { piece: PIECES[2], color: 3, pos: [-5, 1, -6], rot: [0, 60, -15], scale: 0.35 },
    { piece: PIECES[3], color: 4, pos: [5, 4, -9], rot: [25, -45, 10], scale: 0.45 },
    { piece: PIECES[4], color: 5, pos: [-3, 5, -10], rot: [-20, 30, 25], scale: 0.5 },
    { piece: PIECES[5], color: 6, pos: [3, 0.5, -5], rot: [10, -60, 0], scale: 0.3 },
    { piece: PIECES[6], color: 7, pos: [-6, 2.5, -7], rot: [5, 45, -30], scale: 0.4 },
    // Daha fazla parça
    { piece: PIECES[0], color: 1, pos: [6, 3.5, -11], rot: [30, 20, 15], scale: 0.6 },
    { piece: PIECES[2], color: 3, pos: [-7, 4, -12], rot: [-15, -20, 40], scale: 0.55 },
    { piece: PIECES[4], color: 5, pos: [0, 5.5, -14], rot: [20, 0, -20], scale: 0.7 },
  ];
  
  floatingPieces.forEach((fp, index) => {
    const entity = document.createElement('a-entity');
    entity.setAttribute('position', fp.pos.join(' '));
    entity.setAttribute('rotation', fp.rot.join(' '));
    entity.classList.add('floating-tetris');
    
    // Parçanın bloklarını oluştur
    fp.piece.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = document.createElement('a-box');
          const size = fp.scale * 0.2;
          block.setAttribute('position', `${(x - 1) * size} ${(1 - y) * size} 0`);
          block.setAttribute('width', size * 0.9);
          block.setAttribute('height', size * 0.9);
          block.setAttribute('depth', size * 0.9);
          block.setAttribute('material', `
            color: ${COLORS[fp.color]}; 
            emissive: ${COLORS[fp.color]}; 
            emissiveIntensity: 0.4;
            opacity: 0.7;
            transparent: true
          `);
          entity.appendChild(block);
        }
      });
    });
    
    // Dönen animasyon
    const rotSpeed = 5000 + Math.random() * 10000;
    const rotAxis = ['0 360 0', '360 0 0', '0 0 360'][index % 3];
    entity.setAttribute('animation__rotate', `
      property: rotation;
      to: ${parseInt(fp.rot[0]) + parseInt(rotAxis.split(' ')[0])} ${parseInt(fp.rot[1]) + parseInt(rotAxis.split(' ')[1])} ${parseInt(fp.rot[2]) + parseInt(rotAxis.split(' ')[2])};
      dur: ${rotSpeed};
      easing: linear;
      loop: true
    `);
    
    // Yukarı aşağı hareket
    const floatSpeed = 3000 + Math.random() * 4000;
    const floatDist = 0.3 + Math.random() * 0.5;
    entity.setAttribute('animation__float', `
      property: position;
      to: ${fp.pos[0]} ${fp.pos[1] + floatDist} ${fp.pos[2]};
      dur: ${floatSpeed};
      easing: easeInOutSine;
      loop: true;
      dir: alternate
    `);
    
    scene.appendChild(entity);
  });
}

function createGridFloor() {
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  // Neon grid zemin
  const gridContainer = document.createElement('a-entity');
  gridContainer.setAttribute('position', '0 -0.5 0');
  
  // Ana zemin
  const floor = document.createElement('a-plane');
  floor.setAttribute('rotation', '-90 0 0');
  floor.setAttribute('width', '40');
  floor.setAttribute('height', '40');
  floor.setAttribute('material', 'color: #050510; opacity: 0.9; transparent: true');
  gridContainer.appendChild(floor);
  
  // Grid çizgileri
  for (let i = -20; i <= 20; i += 2) {
    // X çizgileri
    const lineX = document.createElement('a-entity');
    lineX.setAttribute('line', `start: ${i} 0.01 -20; end: ${i} 0.01 20; color: #00f5ff; opacity: 0.3`);
    gridContainer.appendChild(lineX);
    
    // Z çizgileri
    const lineZ = document.createElement('a-entity');
    lineZ.setAttribute('line', `start: -20 0.01 ${i}; end: 20 0.01 ${i}; color: #00f5ff; opacity: 0.3`);
    gridContainer.appendChild(lineZ);
  }
  
  // Merkez çizgileri (daha parlak)
  const centerX = document.createElement('a-entity');
  centerX.setAttribute('line', 'start: 0 0.02 -20; end: 0 0.02 20; color: #ff00ff; opacity: 0.6');
  gridContainer.appendChild(centerX);
  
  const centerZ = document.createElement('a-entity');
  centerZ.setAttribute('line', 'start: -20 0.02 0; end: 20 0.02 0; color: #ff00ff; opacity: 0.6');
  gridContainer.appendChild(centerZ);
  
  scene.appendChild(gridContainer);
}

function createAmbientParticles() {
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  // Yüzen parçacıklar
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('a-sphere');
    const x = (Math.random() - 0.5) * 30;
    const y = Math.random() * 8;
    const z = (Math.random() - 0.5) * 20 - 5;
    const size = 0.015 + Math.random() * 0.025;
    const color = COLORS[Math.floor(Math.random() * (COLORS.length - 1)) + 1];
    
    particle.setAttribute('position', `${x} ${y} ${z}`);
    particle.setAttribute('radius', size);
    particle.setAttribute('material', `
      color: ${color}; 
      emissive: ${color}; 
      emissiveIntensity: 1; 
      opacity: 0.8; 
      transparent: true
    `);
    
    // Yukarı hareket
    const speed = 8000 + Math.random() * 12000;
    particle.setAttribute('animation__float', `
      property: position;
      to: ${x} ${y + 4} ${z};
      dur: ${speed};
      easing: linear;
      loop: true;
      dir: alternate
    `);
    
    // Parlaklık
    particle.setAttribute('animation__glow', `
      property: material.emissiveIntensity;
      from: 0.5;
      to: 1.5;
      dur: ${1500 + Math.random() * 2000};
      easing: easeInOutSine;
      loop: true;
      dir: alternate
    `);
    
    scene.appendChild(particle);
  }
  
  // Yıldızlar (uzakta)
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('a-sphere');
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 25 + Math.random() * 15;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) + 5;
    const z = r * Math.sin(phi) * Math.sin(theta) - 10;
    
    star.setAttribute('position', `${x} ${Math.abs(y)} ${z}`);
    star.setAttribute('radius', 0.02 + Math.random() * 0.03);
    star.setAttribute('material', `
      color: white; 
      emissive: white; 
      emissiveIntensity: 2; 
      opacity: ${0.5 + Math.random() * 0.5}; 
      transparent: true
    `);
    
    // Yanıp sönme
    star.setAttribute('animation__twinkle', `
      property: material.opacity;
      from: ${0.3 + Math.random() * 0.3};
      to: ${0.7 + Math.random() * 0.3};
      dur: ${500 + Math.random() * 1500};
      easing: easeInOutSine;
      loop: true;
      dir: alternate
    `);
    
    scene.appendChild(star);
  }
}

// ==================== ÇÖZÜNÜRLÜK AYARI ====================
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('loaded', () => {
      const renderer = scene.renderer;
      if (renderer) {
        // Pixel ratio'yu artır (daha keskin görüntü)
        renderer.setPixelRatio(window.devicePixelRatio * 1.5);
        
        // Antialias kalitesini artır
        renderer.antialias = true;
        
        console.log('📺 Çözünürlük artırıldı:', renderer.getPixelRatio());
      }
    });
  }
});

console.log('🥽 MultiTetris VR yüklendi!');
console.log('🎵 Arcade müzik aktif');
console.log('🎮 3D Tetris deneyimi hazır');
console.log('📺 Yüksek çözünürlük modu');
console.log('👨‍💻 Geliştiren: Cem YILDIRIM');
