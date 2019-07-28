const socket = io("192.168.1.11:5000");
const players = {};

let up = false,
  right = false,
  down = false,
  left = false,
  speed = 10,
  health = 100,
  alive = true;
const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const UIcanvas = document.querySelector("#uiCanvas");
const ctxUI = UIcanvas.getContext("2d");

socket.on("playerDisconnect", playerId => {
  delete players[playerId];
});

socket.on("foodEaten", data => {
  foodPosition = data.newPosition;
});

socket.on("playerConnected", socketId => {
  players[socketId] = { x: 650 / 2, y: 650 / 2, playerId: socketId };
});

socket.on("players", player => {
  console.log(player);
  if (players[player.playerId]) {
    players[player.playerId].playerId = player.playerId;
    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
  } else players[player.playerId] = player;
});

setInterval(() => {
  update();
}, 1000 / 60);

const position = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

let foodPosition = {
  x: 600,
  y: 600
};

socket.on("updateHealth", playerHealth => {
  for (const key in playerHealth) {
    if (playerHealth.hasOwnProperty(key)) {
      if (socket.id == key) {
        health = playerHealth[key].health;
        if (playerHealth[key].dead) alive = false;
      } else {
        if (playerHealth[key].dead) delete players[key];
      }
    }
  }
});

socket.on("onConnect", data => {
  foodPosition = data.foodPosition;

  for (const key in data.players) {
    if (data.players.hasOwnProperty(key)) {
      players[key] = data.players[key];
    }
  }
  socket.off("onConnect");
});

socket.on("randomFoodPos", newPos => {
  console.log(newPos);
  foodPosition = newPos;
});

const update = () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 10000, 10000);
  ctx.beginPath();
  ctx.strokeStyle = "black";

  if (alive) {
    ctx.ellipse(position.x, position.y, 25, 25, Math.PI / 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "20px serif";
  for (const key in players) {
    if (players.hasOwnProperty(key)) {
      ctx.beginPath();
      ctx.ellipse(
        players[key].x,
        players[key].y,
        25,
        25,
        Math.PI / 4,
        0,
        2 * Math.PI
      );
      ctx.fillText(
        players[key].playerId.substring(0, 3).toUpperCase(),
        players[key].x,
        players[key].y + 45
      );
      ctx.stroke();
    }
  }
  updateHealth();
  drawFood(foodPosition);
  drawPlayerScore("0");
  calcFood();

  if (up) {
    if (position.y > 0) {
      position.y -= speed;
    } else {
      position.y = 0;
    }
  }
  if (down) {
    if (position.y < canvas.height) {
      position.y += speed;
    } else {
      position.y = canvas.height;
    }
  }
  if (right) {
    if (position.x < canvas.width) {
      position.x += speed;
    } else {
      position.x = canvas.width;
    }
  }
  if (left) {
    if (position.x > 0) {
      position.x -= speed;
    } else {
      position.x = 0;
    }
  }
  if (left || right || up || down) hasMoved();
};

const updateHealth = val => {
  val = clamp(health, 0, 100);
  drawHungerBar(val);
  if (health <= 0) alive = false;
};

const clamp = (val, min, max) => {
  if (val < min) {
    val = min;
  } else if (val > max) {
    val = max;
  }
  return val;
};

const calcFood = () => {
  let distanceToFood = Math.sqrt(
    Math.pow(position.x - foodPosition.x, 2) +
      Math.pow(position.y - foodPosition.y, 2)
  );

  if (distanceToFood < 45) {
    socket.emit("foodEaten", "");
    health += 25;
    health = health > 100 ? 100 : health;
  }
};

const drawFood = ({ x, y }) => {
  ctx.beginPath();
  ctx.strokeStyle = "#C0392B 10px";
  ctx.ellipse(x, y, 15, 15, Math.PI / 4, 0, 2 * Math.PI);
  ctx.fillStyle = "#E74C3C";
  ctx.fill();
  ctx.stroke();
};

const drawHungerBar = val => {
  ctxUI.fillStyle = "#34495E";
  ctxUI.fillRect(0, 15, UIcanvas.width, 30);

  ctxUI.fillStyle = "#2ECC71";
  ctxUI.fillRect(
    5,
    20,
    UIcanvas.width * (val / 100) - 10,
    20
  );
};

const drawPlayerScore = val => {
  // ctxUI.font = "30px Arial";
  // ctxUI.fillStyle = "lightgray";
  // ctxUI.fillText("Score : 0", 5, 35);
};

const hasMoved = () => {
  socket.emit("movement", position);
};

document.addEventListener("keydown", e => {
  if (e.keyCode === 87 || e.keyCode === 38 /* w */) {
    up = true;
  }
  if (e.keyCode === 68 || e.keyCode === 39 /* d */) {
    right = true;
  }
  if (e.keyCode === 83 || e.keyCode === 40 /* s */) {
    down = true;
  }
  if (e.keyCode === 65 || e.keyCode === 37 /* a */) {
    left = true;
  }
});
document.addEventListener("keyup", e => {
  if (e.keyCode === 87 || e.keyCode === 38 /* w */) {
    up = false;
  }
  if (e.keyCode === 68 || e.keyCode === 39 /* d */) {
    right = false;
  }
  if (e.keyCode === 83 || e.keyCode === 40 /* s */) {
    down = false;
  }
  if (e.keyCode === 65 || e.keyCode === 37 /* a */) {
    left = false;
  }
});
