const socket = io("192.168.1.8:5000");
const players = {};

let up = false,
  right = false,
  down = false,
  left = false,
  speed = 15,
  health = 100,
  alive = true;
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const UIcanvas = document.querySelector("#uiCanvas");
const ctxUI = UIcanvas.getContext("2d");

socket.on("playerDisconnect", playerId => {
  delete players[playerId];
});

socket.on("players", player => {
  if (players[player.player]) {
    players[player.player].xPos = player.xPos;
    players[player.player].yPos = player.yPos;
  } else players[player.player] = player;
});

setInterval(() => {
  update();
}, 1000 / 60);

const position = {
  xPos: 500,
  yPos: 500
};

let foodPosition = {
  x: 200,
  y: 200
};

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
    ctx.ellipse(
      position.xPos,
      position.yPos,
      25,
      25,
      Math.PI / 4,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "20px serif";
  for (const key in players) {
    if (players.hasOwnProperty(key)) {
      ctx.beginPath();
      ctx.ellipse(
        players[key].xPos,
        players[key].yPos,
        25,
        25,
        Math.PI / 4,
        0,
        2 * Math.PI
      );
      ctx.fillText(
        players[key].player.substring(0, 3).toUpperCase(),
        players[key].xPos,
        players[key].yPos + 45
      );
      ctx.stroke();
    }
  }
  health -= 0.15;
  updateHealth();
  drawFood(foodPosition);
  calcFood();

  if (up) {
    if (position.yPos > 0) {
      position.yPos -= speed;
    } else {
      position.yPos = 0;
    }
  }
  if (down) {
    if (position.yPos < canvas.height) {
      position.yPos += speed;
    } else {
      position.yPos = canvas.height;
    }
  }
  if (right) {
    if (position.xPos < canvas.width) {
      position.xPos += speed;
    } else {
      position.xPos = canvas.width;
    }
  }
  if (left) {
    if (position.xPos > 0) {
      position.xPos -= speed;
    } else {
      position.xPos = 0;
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
    Math.pow(position.xPos - foodPosition.x, 2) +
      Math.pow(position.yPos - foodPosition.y, 2)
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
  ctxUI.fillRect(UIcanvas.width * 0.2 - 5, 50, UIcanvas.width * 0.6 + 10, 55);

  ctxUI.fillStyle = "#2ECC71";

  ctxUI.fillRect(
    UIcanvas.width * 0.2,
    54,
    UIcanvas.width * 0.6 * (val / 100),
    46
  );
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
