const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);

server.listen(5000);

const players = {};
let foodPosition = { x: 100, y: 100 };

io.on("connection", socket => {
  console.log(`A client has connected ${socket.id}`);
  socket.broadcast.emit("playerConnected", socket.id);
  socket.emit("onConnect", {
    players,
    foodPosition
  });
  players[socket.id] = { x: 650/2, y:650/2, health: 100 };

  socket.on("movement", movement => {
    if (players.hasOwnProperty(socket.id)) {
      players[socket.id].x = movement.x;
      players[socket.id].y = movement.y;
      movement.playerId = socket.id;
      socket.broadcast.emit("players", movement);
      foodEaten(movement);
    }
  });

  const foodEaten = player => {
    let distanceToFood = Math.sqrt(
      Math.pow(player.x - foodPosition.x, 2) +
        Math.pow(player.y - foodPosition.y, 2)
    );

    if (distanceToFood < 45) {
      const randomX = Math.floor(Math.random() * 400) + 50;
      const randomY = Math.floor(Math.random() * 400) + 50;
      foodPosition = { x: randomX, y: randomY };
      //console.log("Foot eaten by " + socket.id);

      players[player.playerId].health += 25;
      players[player.playerId].health =
        players[player.playerId].health > 100
          ? 100
          : players[player.playerId].health;

      io.emit("foodEaten", {
        eater: player.playerId,
        newPosition: foodPosition
      });
    }
  };

  socket.on("disconnect", () => {
    console.log(`A client with the id ${socket.id} has disconnected`);
    socket.broadcast.emit("playerDisconnect", socket.id);
    delete players[socket.id];
  });
});

updateHealth = () => {
  const playersHealth = {};
  for (const player in players) {
    if (players.hasOwnProperty(player)) {
      players[player].health -= 5;
      playersHealth[player] = {
        health: players[player].health,
        dead: players[player].health <= 0
      };

      if (playersHealth[player].dead) delete players[player];
    }
  }
  if (Object.keys(playersHealth).length > 0)
    io.emit("updateHealth", playersHealth);
};

setInterval(() => {
  updateHealth();
}, 200);
