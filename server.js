const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messeges');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCordBot';

// run when client connects
io.on('connection', (socket) => {
  socket.on('join-room', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord'));

    // broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined to chat`)
      );

    //   send users and room info
    io.to(user.room).emit('room-users', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //   listen for chat message
  socket.on('chat-message', (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    const room = user.room;

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );
    }

    //   send users and room info
    io.to(room).emit('room-users', {
      room: user.room,
      users: getRoomUsers(room),
    });
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
