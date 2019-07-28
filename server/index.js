const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);

server.listen(5000);

io.on("connection", socket => {
  console.log(`A client has connected ${socket.id}`);

  socket.broadcast.emit("playerConnected", socket.id);

  socket.on("foodEaten", () => {
    let randomX = Math.floor(Math.random() * 400) + 50;
    let randomY = Math.floor(Math.random() * 400) + 50;

    let randPos = { x: randomX, y: randomY };
    io.emit("randomFoodPos", randPos);
  });

  socket.on("movement", movement => {
    movement.player = socket.id;
    socket.broadcast.emit("players", movement);
  });

  socket.on("disconnect", () => {
    console.log(`A client with the id ${socket.id} has disconnected`);
    socket.broadcast.emit("playerDisconnect", socket.id);
  });
});
