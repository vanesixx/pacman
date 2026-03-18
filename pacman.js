let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const offsetY = 60; //offset udělá místo pro score a životy
const boardWidth = columnCount * tileSize;
const boardHeight = (rowCount * tileSize) + offsetY;
let context;

let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage, wallImage;

const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "X       bpo       X",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'STAY';
        this.nextDirection = 'STAY';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateVelocity(dir) {
        let vx = 0;
        let vy = 0;
        if (dir === 'U') vy = -tileSize / 4;
        else if (dir === 'D') vy = tileSize / 4;
        else if (dir === 'L') vx = -tileSize / 4;
        else if (dir === 'R') vx = tileSize / 4;
        return { vx, vy };
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.direction = 'STAY';
        this.nextDirection = 'STAY';
    }
}

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");
    loadImages();
    loadMap();
    update();
    document.addEventListener("keydown", movePacman); //čeká na stisknutí klávesy
};

function loadImages() {
    wallImage = new Image(); wallImage.src = "./wall.png";
    blueGhostImage = new Image(); blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./redGhost.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image(); pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const char = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize + offsetY;
            if (char === 'X') walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            else if (char === 'b' || char === 'o' || char === 'p' || char === 'r') {
                let img = char === 'b' ? blueGhostImage : char === 'o' ? orangeGhostImage : char === 'p' ? pinkGhostImage : redGhostImage;
                let ghost = new Block(img, x, y, tileSize, tileSize);
                let randomDir = directions[Math.floor(Math.random() * 4)];
                let v = ghost.updateVelocity(randomDir);
                ghost.direction = randomDir;
                ghost.velocityX = v.vx;
                ghost.velocityY = v.vy;
                ghosts.add(ghost);
            } else if (char === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (char === ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }
}

function update() {
    if (gameOver) {
        draw();
        return;
    }
    move();
    draw();
    setTimeout(update, 50);
}

//změní směr pacmana když hráč stiskne klávesu
function move() {
    if (pacman.nextDirection !== 'STAY') {
        let nextVel = pacman.updateVelocity(pacman.nextDirection);
        pacman.x += nextVel.vx;
        pacman.y += nextVel.vy;
        let canTurn = true;
        for (let wall of walls) {
            if (collision(pacman, wall)) { canTurn = false; break; }
        }
        pacman.x -= nextVel.vx;
        pacman.y -= nextVel.vy;
        if (canTurn) {
            pacman.direction = pacman.nextDirection;
            pacman.velocityX = nextVel.vx;
            pacman.velocityY = nextVel.vy;
            if (pacman.direction === 'U') pacman.image = pacmanUpImage;
            if (pacman.direction === 'D') pacman.image = pacmanDownImage;
            if (pacman.direction === 'L') pacman.image = pacmanLeftImage;
            if (pacman.direction === 'R') pacman.image = pacmanRightImage;
        }
    }

    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    //pokud pacman narazí do stěny, zastaví se
    for (let wall of walls) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            pacman.velocityX = 0;
            pacman.velocityY = 0;
            break;
        }
    }

    for (let ghost of ghosts) {
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        let ghostHitWall = false;
        for (let wall of walls) {
            if (collision(ghost, wall)) {
                ghostHitWall = true;
                break;
            }
        }

        if (ghostHitWall || Math.random() < 0.15) { //jestli duch narazí může změnit směr na 15%
            ghost.x -= ghost.velocityX;
            ghost.y -= ghost.velocityY;
            let availableDirs = directions.filter(d => {
                let v = ghost.updateVelocity(d);
                ghost.x += v.vx;
                ghost.y += v.vy;
                let col = false;
                for (let wall of walls) { if (collision(ghost, wall)) { col = true; break; } }
                ghost.x -= v.vx;
                ghost.y -= v.vy;
                return !col;
            });
            if (availableDirs.length > 0) {
                let newDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
                let gVel = ghost.updateVelocity(newDir);
                ghost.direction = newDir;
                ghost.velocityX = gVel.vx;
                ghost.velocityY = gVel.vy;
            }
        }

        //jestli pacman narazí do ducha tak se mu ztratí život
        if (collision(ghost, pacman)) {
            lives--;
            if (lives <= 0) { gameOver = true; return; }
            resetPositions();
        }
    }

    //jezení jídla
    let foodEaten = null;
    for (let food of foods) {
        if (collision(pacman, food)) { foodEaten = food; score += 10; break; }
    }
    if (foodEaten) foods.delete(foodEaten);
    if (foods.size === 0) { loadMap(); resetPositions(); } //pokud vše je snězeno tak se resetuje mapa
}

function draw() {
    context.fillStyle = "black";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle = "white";
    context.font = "20px 'Courier New'";
    context.textAlign = "center";
    context.fillText("SCORE: " + String(score).padStart(4, '0'), boardWidth / 2, 35);

    context.textAlign = "left"; //vykreslení srdíček
    let hearts = "";
    for(let i=0; i<lives; i++) hearts += "❤️";
    context.fillText(hearts, 10, 35);

    for (let wall of walls) {
        context.strokeStyle = "blue";
        context.lineWidth = 2;
        context.strokeRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4);
    }
    for (let food of foods) {
        context.fillStyle = "#ffb8ae";
        context.fillRect(food.x, food.y, food.width, food.height);
    }
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for (let ghost of ghosts) context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);

    //vykreslí gameover pokud je konec hry
    if (gameOver) {
        context.fillStyle = "red";
        context.font = "40px Courier";
        context.textAlign = "center";
        context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2);
    }
}

function movePacman(e) {
    if (gameOver) {
        lives = 3; score = 0; gameOver = false;
        loadMap();
        resetPositions();
        update();
        return;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (e.code === "ArrowUp" || e.code === "KeyW") pacman.nextDirection = 'U';
    else if (e.code === "ArrowDown" || e.code === "KeyS") pacman.nextDirection = 'D';
    else if (e.code === "ArrowLeft" || e.code === "KeyA") pacman.nextDirection = 'L';
    else if (e.code === "ArrowRight" || e.code === "KeyD") pacman.nextDirection = 'R';
}

function collision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.image = pacmanRightImage;
    for (let ghost of ghosts) {
        ghost.reset();
        let randomDir = directions[Math.floor(Math.random() * 4)];
        let gVel = ghost.updateVelocity(randomDir);
        ghost.direction = randomDir;
        ghost.velocityX = gVel.vx;
        ghost.velocityY = gVel.vy;
    }
}