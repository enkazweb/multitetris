const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static dosyaları sun
app.use(express.static(path.join(__dirname, 'public')));

// Odalar
const rooms = new Map();

// Rastgele oda kodu oluştur
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);
  
  // Oda oluştur
  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode();
    
    rooms.set(roomCode, {
      players: [{
        id: socket.id,
        name: playerName || 'Oyuncu 1',
        ready: false,
        board: null,
        score: 0,
        gameOver: false
      }],
      started: false,
      startTime: null
    });
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 0;
    
    socket.emit('roomCreated', { roomCode, playerIndex: 0 });
    console.log(`Oda oluşturuldu: ${roomCode}`);
  });
  
  // Odaya katıl
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Oda bulunamadı!');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', 'Oda dolu!');
      return;
    }
    
    if (room.started) {
      socket.emit('error', 'Oyun başlamış!');
      return;
    }
    
    room.players.push({
      id: socket.id,
      name: playerName || 'Oyuncu 2',
      ready: false,
      board: null,
      score: 0,
      gameOver: false
    });
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 1;
    
    socket.emit('roomJoined', { roomCode, playerIndex: 1 });
    
    // Tüm oyunculara bildir
    io.to(roomCode).emit('playerUpdate', {
      players: room.players.map(p => ({ name: p.name, ready: p.ready }))
    });
    
    console.log(`${playerName} odaya katıldı: ${roomCode}`);
  });
  
  // Hazır durumu
  socket.on('ready', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    
    const player = room.players[socket.playerIndex];
    if (player) {
      player.ready = true;
      
      io.to(socket.roomCode).emit('playerUpdate', {
        players: room.players.map(p => ({ name: p.name, ready: p.ready }))
      });
      
      // İki oyuncu da hazırsa oyunu başlat
      if (room.players.length === 2 && room.players.every(p => p.ready)) {
        room.started = true;
        room.startTime = Date.now();
        
        // Her iki oyuncuya da aynı seed gönder (aynı parça sırası için)
        const seed = Math.floor(Math.random() * 1000000);
        io.to(socket.roomCode).emit('gameStart', { seed });
        console.log(`Oyun başladı: ${socket.roomCode}`);
      }
    }
  });
  
  // Oyun durumu güncelleme
  socket.on('gameUpdate', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    
    const player = room.players[socket.playerIndex];
    if (player) {
      player.board = data.board;
      player.score = data.score;
      player.currentPiece = data.currentPiece;
      player.currentPos = data.currentPos;
    }
    
    // Rakibe gönder
    socket.to(socket.roomCode).emit('opponentUpdate', {
      board: data.board,
      score: data.score,
      currentPiece: data.currentPiece,
      currentPos: data.currentPos
    });
  });
  
  // Oyuncu oyunu kaybetti
  socket.on('gameOver', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    
    const player = room.players[socket.playerIndex];
    if (player) {
      player.gameOver = true;
      player.score = data.score;
    }
    
    // Rakibe bildir
    socket.to(socket.roomCode).emit('opponentGameOver', { score: data.score });
    
    // Her iki oyuncu da bittiyse sonuç gönder
    if (room.players.every(p => p.gameOver)) {
      const winner = room.players[0].score > room.players[1].score ? 0 : 
                     room.players[1].score > room.players[0].score ? 1 : -1;
      
      io.to(socket.roomCode).emit('gameEnd', {
        winner,
        scores: room.players.map(p => ({ name: p.name, score: p.score }))
      });
    }
  });
  
  // Yeniden oyna - VR için hemen başlat
  socket.on('playAgain', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    
    const player = room.players[socket.playerIndex];
    if (player) {
      player.wantsRematch = true;
    }
    
    // İki oyuncu da rematch istiyorsa hemen başlat
    if (room.players.length === 2 && room.players.every(p => p.wantsRematch)) {
      // Reset
      room.players.forEach(p => {
        p.ready = true;
        p.board = null;
        p.score = 0;
        p.gameOver = false;
        p.wantsRematch = false;
      });
      room.started = true;
      room.startTime = Date.now();
      
      // Yeni seed ile oyunu başlat
      const seed = Math.floor(Math.random() * 1000000);
      io.to(socket.roomCode).emit('gameRestart', { seed });
      console.log(`Oyun yeniden başladı: ${socket.roomCode}`);
    } else {
      // Rakip bekleniyor
      socket.emit('waitingForRematch');
      socket.to(socket.roomCode).emit('opponentWantsRematch');
    }
  });
  
  // Oyundan çıkış - Her iki oyuncuyu da ana menüye gönder
  socket.on('exitGame', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    
    // Her iki oyuncuya da çıkış bildirimi gönder
    io.to(socket.roomCode).emit('exitToMenu');
    
    // Odayı sil
    rooms.delete(socket.roomCode);
    console.log(`Oyuncu çıktı, oda silindi: ${socket.roomCode}`);
  });
  
  // Bağlantı koptu
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
    
    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        // Rakibe bildir
        socket.to(socket.roomCode).emit('opponentLeft');
        
        // Odayı temizle
        rooms.delete(socket.roomCode);
        console.log(`Oda silindi: ${socket.roomCode}`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 MultiTetris sunucusu çalışıyor: http://localhost:${PORT}`);
});
