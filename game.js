let canvas = document.getElementById("gameCanvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const mouse = new Vector2(undefined, undefined);

const keyEvents = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    mouseDown: false,
    shift: false,
};

const relativeToReal = new (class {
    constructor() {
        // These are defined in borders.reEvaluate()
        this.multiplier = undefined;
        this.xOffset = undefined;
        this.yOffset = undefined;
    }

    convert(vector) {
        return new Vector2(
            vector.x * this.multiplier + this.xOffset,
            vector.y * this.multiplier + this.yOffset
        );
    }

    convertX(x) {
        return x * this.multiplier + this.xOffset;
    }

    convertY(y) {
        return y * this.multiplier + this.yOffset;
    }
})();

class Block {
    constructor(relativePos, relativeSideLength, colour) {
        this.relativePos = relativePos;
        this.realPos = relativeToReal.convert(relativePos);
        this.relativeSideLength = relativeSideLength;
        this.colour = colour;
    }

    draw() {
        // TODO: make the block cluster glow if the player is inhabiting it
        ctx.beginPath();
        ctx.fillStyle = this.colour;
        // ctx.fillRect(this.realPos.x - (this.sidelength * relativeToReal.multiplier / 2),
        //              this.realPos.y - (this.sidelength * relativeToReal.multiplier / 2),
        //              this.relativeSideLength * relativeToReal.multiplier,
        //              this.relativeSideLength * relativeToReal.multiplier);
        // ctx.closePath();
        this.realPos = relativeToReal.convert(this.relativePos);
        let halfSideLength =
            (this.relativeSideLength * relativeToReal.multiplier) / 2;

        ctx.fillRect(
            this.realPos.x - halfSideLength,
            this.realPos.y - halfSideLength,
            this.relativeSideLength * relativeToReal.multiplier,
            this.relativeSideLength * relativeToReal.multiplier
        );
        // ctx.moveTo(
        //     this.realPos.x - halfSideLength,
        //     this.realPos.y + halfSideLength
        // );
        // ctx.lineTo(
        //     this.realPos.x + halfSideLength,
        //     this.realPos.y + halfSideLength
        // );
        // ctx.lineTo(
        //     this.realPos.x + halfSideLength,
        //     this.realPos.y - halfSideLength
        // );
        // ctx.lineTo(
        //     this.realPos.x - halfSideLength,
        //     this.realPos.y - halfSideLength
        // );
        // ctx.lineTo(
        //     this.realPos.x - halfSideLength,
        //     this.realPos.y + halfSideLength
        // );
        ctx.fill();
    }
}

class Room {
    constructor(roomID, width, height, objects) {
        this.ID = roomID;
        this.width = width;
        this.height = height;
        this.objects = objects;
    }

    drawAll() {
        this.objects.forEach((object) => {
            object.draw();
        });
    }
}

class Level {
    constructor(levelID, roomsList) {
        this.ID = levelID;
        this.roomsList = roomsList;
        this.currentRoomID = undefined;
        this.current = {
            width: undefined,
            height: undefined,
        };
        this.loadRoom(0);
    }

    loadRoom(roomID) {
        if (roomID >= this.roomsList.length) {
            console.error("roomID out of range.");
            return false;
        }
        this.currentRoomID = roomID;
        this.current.width = this.roomsList[roomID].width;
        this.current.height = this.roomsList[roomID].height;

        return this.roomsList[roomID];
    }
}

const game = new (class {
    constructor() {
        this.paused = false;
        this.current = {
            width: undefined,
            height: undefined,
            levelID: 0,

            roomID: undefined,
        };
        this.levelList = [
            new Level(0, [
                new Room(0, 300, 150, [
                    new Block(new Vector2(205, 115), 10, "Black"),
                    new Block(new Vector2(155, 135), 10, "Black"),
                    new Block(new Vector2(150, 100), 20, "Black"),
                    new Block(new Vector2(155, 85), 10, "Black"),
                ]),
                new Room(1, 100, 100, [
                    new Block(new Vector2(150, 75), 10, "Black"),
                ]),
            ]),
        ];
        this.borders = {
            top: undefined,
            bottom: undefined,
            left: undefined,
            right: undefined,
            colour: "Black",
            draw() {
                ctx.fillStyle = this.colour;
                ctx.fillRect(0, 0, innerWidth, innerHeight);
                ctx.clearRect(
                    this.left, // TL X
                    this.top, // TL Y
                    this.right - this.left, // Width
                    this.bottom - this.top // Height
                );
            },
        };
        this.loadRoom(0);
        this.updateBorders();
    }

    drawAll() {
        this.levelList[this.current.levelID].roomsList[
            this.current.roomID
        ].drawAll();
    }

    loadLevel(levelID) {
        if (levelID >= this.levelList.length) {
            console.error("levelID out of range.");
            return false;
        }
        this.current.levelID = levelID;
        this.current.width = this.levelList[levelID].current.width;
        this.current.height = this.levelList[levelID].current.height;
        this.updateBorders();
    }

    loadRoom(roomID) {
        if (roomID >= this.levelList[this.current.levelID].roomsList.length) {
            console.error("roomID out of range.");
            return false;
        }
        this.current.roomID = roomID;
        let currentRoom = this.levelList[this.current.levelID].loadRoom(roomID);
        this.current.width = currentRoom.height;
        this.current.height = currentRoom.height;
        this.loadLevel(this.current.levelID);
    }

    updateBorders() {
        if (
            window.innerWidth / window.innerHeight >
            this.current.width / this.current.height
        ) {
            this.borders.top = window.innerHeight / 16;
            this.borders.bottom = window.innerHeight * (15 / 16);
            relativeToReal.yOffset = this.borders.top;

            let relativeWidth =
                ((window.innerHeight * (14 / 16)) / this.current.height) *
                this.current.width;
            relativeToReal.multiplier =
                (window.innerHeight * (14 / 16)) / this.current.height;

            this.borders.left = (window.innerWidth - relativeWidth) / 2;
            this.borders.right =
                window.innerWidth - (window.innerWidth - relativeWidth) / 2;
            relativeToReal.xOffset = this.borders.left;
        } else {
            this.borders.left = window.innerWidth / 16;
            this.borders.right = window.innerWidth * (15 / 16);
            relativeToReal.xOffset = this.borders.left;

            let relativeHeight =
                ((window.innerWidth * (14 / 16)) / this.current.width) *
                this.current.height;
            relativeToReal.multiplier =
                (window.innerWidth * (14 / 16)) / this.current.width;

            this.borders.top = (window.innerHeight - relativeHeight) / 2;
            this.borders.bottom =
                window.innerHeight - (window.innerHeight - relativeHeight) / 2;
            relativeToReal.yOffset = this.borders.top;
        }
    }
})();

const player = new (class {
    constructor() {
        this.relativePos = new Vector2(
            game.current.width / 2,
            game.current.height / 2
        );
        this.realPos = relativeToReal.convert(this.relativePos);
        this.gravityStrength = 1;
        this.velocity = new Vector2(0, 0);
        this.nextPos = this.relativePos;
        this.relativeSideLength = 10;
        this.relativeSize = Math.pow(this.relativeSideLength, 2);
        this.freeSpirit = false;
        this.bodyColour = "Black";
        this.spiritColour = "White";
        this.canJump = false;
        this.spiritSize = this.relativeSideLength * 0.7;
    }

    draw() {
        // Draw Player Body

        ctx.beginPath();

        ctx.strokeStyle = this.bodyColour;
        ctx.fillStyle = this.bodyColour;

        let halfSideLength =
            (this.relativeSideLength * relativeToReal.multiplier) / 2;

        ctx.moveTo(
            this.realPos.x - halfSideLength,
            this.realPos.y + halfSideLength
        );
        ctx.lineTo(
            this.realPos.x + halfSideLength,
            this.realPos.y + halfSideLength
        );
        ctx.lineTo(
            this.realPos.x +
                halfSideLength +
                this.velocity.x * relativeToReal.multiplier,
            this.realPos.y - halfSideLength
        );
        ctx.lineTo(
            this.realPos.x -
                halfSideLength +
                this.velocity.x * relativeToReal.multiplier,
            this.realPos.y - halfSideLength
        );
        ctx.lineTo(
            this.realPos.x - halfSideLength,
            this.realPos.y + halfSideLength
        );
        ctx.fill();

        ctx.shadowColor = "rgba(255, 255, 255, 1)";
        ctx.shadowBlur = (125 * this.spiritSize) / this.relativeSideLength;
        ctx.strokeStyle = this.spiritColour;
        ctx.fillStyle = this.spiritColour;

        // Draw Spirit
        // Do not tweak, only touch it if you re-write the whole function.
        // I have no clue how it works but it does somehow.
        ctx.beginPath();

        halfSideLength = (this.spiritSize * relativeToReal.multiplier) / 2;

        ctx.moveTo(
            this.realPos.x -
                halfSideLength +
                ((this.relativeSideLength - this.spiritSize) *
                    this.velocity.x *
                    relativeToReal.multiplier) /
                    (this.relativeSideLength * 2),
            this.realPos.y + halfSideLength
        );
        ctx.lineTo(
            this.realPos.x +
                halfSideLength +
                ((this.relativeSideLength - this.spiritSize) *
                    this.velocity.x *
                    relativeToReal.multiplier) /
                    (this.relativeSideLength * 2),
            this.realPos.y + halfSideLength
        );
        ctx.lineTo(
            this.realPos.x +
                halfSideLength +
                ((this.relativeSideLength - this.spiritSize) *
                    this.velocity.x *
                    relativeToReal.multiplier) /
                    (this.relativeSideLength * 2) +
                (this.velocity.x *
                    relativeToReal.multiplier *
                    this.spiritSize) /
                    this.relativeSideLength,
            this.realPos.y - halfSideLength
        );
        ctx.lineTo(
            this.realPos.x -
                halfSideLength +
                ((this.relativeSideLength - this.spiritSize) *
                    this.velocity.x *
                    relativeToReal.multiplier) /
                    (this.relativeSideLength * 2) +
                (this.velocity.x *
                    relativeToReal.multiplier *
                    this.spiritSize) /
                    this.relativeSideLength,
            this.realPos.y - halfSideLength
        );
        ctx.lineTo(
            this.realPos.x -
                halfSideLength +
                ((this.relativeSideLength - this.spiritSize) *
                    this.velocity.x *
                    relativeToReal.multiplier) /
                    (this.relativeSideLength * 2),
            this.realPos.y + halfSideLength
        );
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    processkeyEvents() {
        let xDirection = 0;
        if (keyEvents.a && !keyEvents.d) {
            this.velocity.x -= 0.5;
            xDirection = -1;
        } else if (keyEvents.d && !keyEvents.a) {
            this.velocity.x += 0.5;
            xDirection = 1;
        } else {
            if (this.velocity.x < -0.5 || this.velocity.x > 0.5) {
                this.velocity.x /= 1.2;
            } else {
                this.velocity.x = 0;
            }
        }

        if (keyEvents.space && this.canJump) {
            this.velocity.y = this.relativeSize * -1;
            this.canJump = false;
        }

        if (keyEvents.s) {
            this.gravityStrength = 2;
        } else {
            this.gravityStrength = 1;
        }

        return xDirection;
    }

    willCollide(Block) {
        let dist = (Block.relativeSideLength + this.relativeSideLength) / 2;
        return (
            Block.relativePos.x - dist <= this.nextPos.x &&
            this.nextPos.x <= Block.relativePos.x + dist &&
            Block.relativePos.y - dist <= this.nextPos.y &&
            this.nextPos.y <= Block.relativePos.y + dist
        );
    }

    processCollisions() {
        this.canJump = false;
        if (this.nextPos.y < this.relativeSideLength / 2) {
            this.velocity.y = this.velocity.y > 0 ? this.velocity.y : 0;
            this.relativePos.y = this.relativeSideLength / 2;
        } else if (
            this.nextPos.y >
            game.current.height - this.relativeSideLength / 2
        ) {
            this.velocity.y = this.velocity.y < 0 ? this.velocity.y : 0;
            this.relativePos.y =
                game.current.height - this.relativeSideLength / 2;
            this.canJump = true;
        }

        if (this.nextPos.x < this.relativeSideLength / 2) {
            this.velocity.x = this.velocity.x > 0 ? this.velocity.x : 0;
            this.relativePos.x = this.relativeSideLength / 2;
        } else if (
            this.nextPos.x >
            game.current.width - this.relativeSideLength / 2
        ) {
            this.velocity.x = this.velocity.x < 0 ? this.velocity.x : 0;
            this.relativePos.x =
                game.current.width - this.relativeSideLength / 2;
        }

        // Code for collisions with Blocks/blocks here [UNFINISHED]
        game.levelList[game.current.levelID].roomsList[
            game.current.roomID
        ].objects.forEach((Block) => {
            if (this.willCollide(Block)) {
                let dist =
                    (this.relativeSideLength + Block.relativeSideLength) / 2;
                let distX = this.nextPos.x - Block.relativePos.x;
                let distY = this.nextPos.y - Block.relativePos.y;

                if (-1 * distY >= Math.abs(distX)) {
                    // Top section
                    this.velocity.y = this.velocity.y < 0 ? this.velocity.y : 0;
                    this.relativePos.y = Block.relativePos.y - dist;
                    this.canJump = true;
                } else if (-1 * distX > Math.abs(distY)) {
                    // Left section
                    this.velocity.x = this.velocity.x < 0 ? this.velocity.x : 0;
                    this.relativePos.x = Block.relativePos.x - dist;
                } else if (distX > Math.abs(distY)) {
                    // Right section
                    this.velocity.x = this.velocity.x > 0 ? this.velocity.x : 0;
                    this.relativePos.x = Block.relativePos.x + dist;
                } else if (distY >= Math.abs(distX)) {
                    // Bottom section
                    this.velocity.y = this.velocity.y > 0 ? this.velocity.y : 0;
                    this.relativePos.y = Block.relativePos.y + dist;
                }
            }
        });
    }

    update() {
        // TODO: Make the player be able to function when the spirit is in habiting blocks (detached from player)
        let xDirection = this.processkeyEvents();

        if (!this.freeSpirit) {
            this.velocity.y += (this.gravityStrength * this.relativeSize) / 350;
            let qwertX = 25;
            let qwertY = 50;
            // Enforce speed Limit
            if (this.velocity.x >= this.relativeSize / qwertX) {
                this.velocity.x = this.relativeSize / qwertX;
            } else if (this.velocity.x <= (-1 * this.relativeSize) / qwertX) {
                this.velocity.x = (-1 * this.relativeSize) / qwertX;
            }

            if (this.velocity.y >= this.relativeSize) {
                this.velocity.y = this.relativeSize;
            } else if (this.velocity.y <= (-2 * this.relativeSize) / qwertY) {
                this.velocity.y = (-2 * this.relativeSize) / qwertY;
            }

            this.relativePos.x += this.velocity.x;
            this.relativePos.y += this.velocity.y;

            this.processCollisions();
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.relativePos = new Vector2(
                (Math.floor(this.relativePos.x / this.relativeSideLength) +
                    0.5) *
                    this.relativeSideLength,
                (Math.floor(this.relativePos.y / this.relativeSideLength) +
                    0.5) *
                    this.relativeSideLength
            );
        }

        this.realPos = relativeToReal.convert(this.relativePos);

        if (this.freeSpirit) {
            if (this.spiritSize > this.relativeSideLength * 0.35) {
                this.spiritSize /= 1.2;
            } else {
                this.spiritSize = this.relativeSideLength * 0.3;
            }
        } else {
            if (this.spiritSize < this.relativeSideLength * 0.675) {
                this.spiritSize *= 0.9;
                this.spiritSize += 1;
            } else {
                this.spiritSize = this.relativeSideLength * 0.7;
            }
        }

        if (this.spiritSize == this.relativeSideLength * 0.3) {
            game.levelList[game.current.levelID].roomsList[
                game.current.roomID
            ].objects.push(
                new Block(
                    this.relativePos,
                    this.relativeSideLength,
                    this.colour
                )
            );
        } // TODO: Make the player inhabit the block when shift is released

        this.draw();

        this.nextPos = new Vector2(
            this.relativePos.x + this.velocity.x + 0.5 * xDirection,
            this.relativePos.y +
                this.velocity.y +
                (this.gravityStrength * this.relativeSize) / 350
        );
    }
})();

hacks = false;

function initEventListeners() {
    window.addEventListener("resize", function () {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        // Fix borders after resize
        game.updateBorders();
    });

    window.addEventListener("mousemove", function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener("keydown", function (event) {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = true;
                break;
            case "s":
                keyEvents.s = true;
                break;
            case "d":
                keyEvents.d = true;
                break;
            case "f":
                game.paused = true;
                break;
            case "w":
            case " ":
                keyEvents.space = true;
                break;
            case "shift":
                player.freeSpirit = true;
                break;
            default:
                break;
        }
    });

    window.addEventListener("keyup", function (event) {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = false;
                break;
            case "s":
                keyEvents.s = false;
                break;
            case "d":
                keyEvents.d = false;
                break;
            case "f":
                game.paused = false;
                break;
            case "w":
            case " ":
                keyEvents.space = false;
                break;
            case "shift":
                player.freeSpirit = false;
                break;
            default:
                break;
        }
    });

    window.addEventListener("mousedown", function () {
        keyEvents.mouseDown = true;
    });

    window.addEventListener("mouseup", function () {
        keyEvents.mouseDown = false;
    });
}

initEventListeners();

function animate() {
    requestAnimationFrame(animate);
    if (!(hacks && game.paused)) {
        // if (hacks && keyEvents.mouseDown) {
        //     player.relativePos.x =
        //         (mouse.x - relativeToReal.xOffset) / relativeToReal.multiplier;
        //     player.relativePos.y =
        //         (mouse.y - relativeToReal.yOffset) / relativeToReal.multiplier;
        //     player.velocity.x = 0;
        //     player.velocity.y = 0;
        // }
        game.borders.draw();
        game.drawAll();
        player.update();
    }
}

animate();
