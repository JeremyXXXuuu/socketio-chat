// Setup basic express server
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));

// Chatroom
let userMap = new Map();
let muteMap = new Map();
let numUsers = 0;

io.on("connection", (socket) => {
  let addedUser = false;

  // when the client emits 'new message', this listens and executes

  socket.on("new message", (data) => {
    let Data = data.split(" ");
    if (Data.includes("windows") || Data.includes("microsoft")) {
      Data = Data.map((e) => {
        if (e === "windows" || e === "microsoft") {
          e = "*";
        }
        return e;
      });
    }
    let str = Data.join(" ");

    console.log(str);
    let mesType = Data[0];
    let user = Data[1];

    Data.shift();
    Data.shift();
    Data = Data.join(" ");

    if (mesType === "/mute" && user) {
      let temp = [];
      temp = muteMap.get(socket.id);
      temp.push(userMap.get(user));
      muteMap.set(socket.id, temp);
    } else if (mesType === "/unmute" && user) {
      let temp = [];
      temp = muteMap.get(socket.id);
      var index = temp.indexOf(userMap.get(user));
      if (index > -1) {
        temp.splice(index, 1);
      }
      muteMap.set(socket.id, temp);
    } else if (mesType === "/whisper" && user) {
      socket.to(userMap.get(user)).emit("new message", {
        username: socket.username,
        message: Data,
      });
    } else {
      var target = [];
      muteMap.forEach((value, key) => {
        if (value.includes(socket.id)) {
          return true;
        }
        target.push(key);
      });

      target.forEach((e) => {
        socket.to(e).emit("new message", {
          username: socket.username,
          message: str,
        });
      });

      // we tell the client to execute 'new message'
      // we tell the client to execute 'new message'
      // socket.broadcast.emit('new message', {
      //   username: socket.username,
      //   message: data
      // });
    }
  });

  // we tell the client to execute 'new message'

  // when the client emits 'add user', this listens and executes
  socket.on("add user", (username) => {
    if (addedUser) return;
    // we store the username in the socket session for this client
    socket.username = username;
    muteMap.set(socket.id, []);
    userMap.set(username, socket.id);
    // console.log(userMap)
    // console.log(muteMap)

    ++numUsers;
    addedUser = true;

    socket.emit("login", {
      numUsers: numUsers,
    });
    //  console.log(socket)
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
    });
  });

  // // when the client emits 'typing', we broadcast it to others
  // socket.on('typing', () => {
  //   socket.broadcast.emit('typing', {
  //     username: socket.username
  //   });
  // });

  // // when the client emits 'stop typing', we broadcast it to others
  // socket.on('stop typing', () => {
  //   socket.broadcast.emit('stop typing', {
  //     username: socket.username
  //   });
  // });

  // when the user disconnects.. perform this
  socket.on("disconnect", () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
      });
    }
  });
});
