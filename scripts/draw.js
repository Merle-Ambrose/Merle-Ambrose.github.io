/*
    AUTHOR: POLINA TIKHOMIROVA
    DATE: 10/29/21
    PURPOSE: Make a mini-platformer.
*/

// Upon loading the page, manipulate the canvas
window.addEventListener('load', (e) => {
    class Scene {
        constructor(width, height, sprites, delay) {
            this.width = width;
            this.height = height;
            this.sprites = sprites;
            this.delay = delay;
            this.context = document.getElementById("canvas").getContext("2d");
            this.paused = false;

            // The player will always be the first in the sprite array
            if(!sprites || sprites.length == 0 || !(sprites[0] instanceof Player)) {
                throw new UserException('The "Player" object must always be first object in the sprite array.');
            }
            this.player = sprites[0];

            // Create object for arrow key states 
            // key up = true; key down = false
            this.keysUp = {};
            this.keysUp['37'] = false; // left arrow key
            this.keysUp['38'] = false; // up arrow key
            this.keysUp['39'] = false; // right arrow key
            this.keysUp['40'] = false; // down array key
        }

        // Create the scene and its event listeners
        start() {
            // Draw the scene on the canvas
            this.drawSpritesTimer = new Timer(this, this.draw);
            this.updateTimer = new Timer(this, this.update);
            // Check if two key-related global functions exist
            if(typeof keyPressed !== "undefined" 
                && typeof keyReleased !== "undefined") {
                document.addEventListener('keydown', keyPressed);
                document.addEventListener('keyup', keyReleased);
            }
            // Check if mouse-related global function exists
            if(typeof mousePressed !== "undefined") {
                canvas.addEventListener('click', mousePressed);
            }
        }

        // Erase everything from the screen and stop updating scene
        end() {
            this.drawSpritesTimer.stopTimer();
            this.updateTimer.stopTimer();
            this.drawBackground();
            // Remove ALL event listeners
            if(typeof keyPressed !== "undefined" 
                && typeof keyReleased !== "undefined") {
                document.removeEventListener('keydown', keyPressed);
                document.removeEventListener('keyup', keyReleased);
            }
            if(typeof mousePressed !== "undefined") {
                canvas.removeEventListener('click', mousePressed);
            }
        }

        // Calling this method once will pause updating the screen;
        // calling it twice will resume screen updating.
        pause() {
            // Stop updating sprites on the screen
            paused = !paused;
            // If not paused, pause the timers
            if(!this.drawSpritesTimer.intervalIsNull()) {
                this.drawSpritesTimer.stopTimer();
                this.updateTimer.stopTimer();
            }
            // If already paused, start the timers back up
            else {
                this.drawSpritesTimer.startTimer();
                this.updateTimer.startTimer();
            }
        }

        // Draw background and all sprites on the scene
        draw(obj) {
            if(!obj.paused) {
                obj.drawBackground();
                if(obj.sprites !== undefined 
                    && obj.sprites !== null 
                    && obj.sprites.length > 0) {
                    obj.sprites.forEach(sprite => {
                        sprite.draw();
                    });
                }
            }
        }

        // Update all sprites in the scene
        update(obj) {
            if(!obj.paused) {
                if(obj.sprites !== undefined 
                    && obj.sprites !== null 
                    && obj.sprites.length > 0) {
                    obj.sprites.forEach(sprite => {
                        if (!(sprite instanceof Player)) { // sprite is not a player
                            // Check if object collides with player
                            if(sprite.collidesWith(obj.player)) {
                                obj.player.onCollisonY(sprite);
                            }
                            sprite.update();
                        }
                        else { // sprite is player
                            sprite.update(obj.keysUp);
                            obj.player.setHasObjectCollisionFalse(); // reset collisions
                        }
                    });
                }
            }
        }

        drawBackground() {
            // Draws background on the screen
            this.context.fillStyle = "white";
            this.context.fillRect(0, 0, this.width, this.height);
        }

        setKeyUpState(keyUp, keyCode) {
            // Check if key exists in the keys you're checking for
            if(keyCode in this.keysUp) {
                this.keysUp[keyCode] = keyUp;
            }
        }

        addSprite(sprite) {
            this.sprites.push(sprite);
        }
    }

    class Sprite {
        constructor(width, height, x, y, dx, dy) {
            this.width = width;
            this.height = height;
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.context = document.getElementById("canvas").getContext("2d");
        }

        // 'draw' is different for every sprite
        draw(){
            
        }

        // 'update' is different for every sprite
        update() {
            
        }

        // Check if in-bounds of (but not past the edge) of the X-coordinate.
        // Return true if still in-bounds.
        inBoundsX(boundXLower, boundXUpper) {
            if(this.x + this.width > boundXUpper
                || this.x < boundXLower) {
                return false;
            }
            return true;
        }

        // Return true if a collison occurs and false if it doesn't
        collidesWith(sprite) {
            // Check both sprites' boundaries and see if
            // they DON'T intersect with each other
            if(this.x > sprite.x + sprite.width
                || this.x + this.width < sprite.x
                || this.y > sprite.y + sprite.height
                || this.y + this.height < sprite.y) {
                    return false;
            }
            return true;
        }

        setPosition(x, y) {
            this.x = x;
            this.y = y;
        }        
    }

    class Platform extends Sprite {
        constructor(width, height, x, y) {
            super(width, height, x, y, 0, 0);
        }

        draw() {
            this.context.fillStyle = "black";
            this.context.fillRect(this.x, this.y, this.width, this.height);
        }

        update() {
            super.update();
        }
    }

    class Player extends Sprite {
        constructor(width, height, x, y) {
            super(width, height, x, y, 0, 0);
            this.gravity = 0.8;
            this.playerSpeed = 2;
            this.playerJumpHeight = 20;
            this.friction = 0.9;
            this.airResistance = 0.9;
            // Checks if player is jumping or in the air
            this.isJumping = false;
            // Checks if a player is sitting on an object
            this.bottomCollision = false;
        }

        draw() {
            this.context.fillStyle = "red";
            this.context.fillRect(this.x, this.y, this.width, this.height);
        }

        // Pass in key states and update the player depending
        // on what keys are pressed
        update(keysUp) {
            // Jump if not currently jumping or in the air
            if(!this.isJumping) {
                if(keysUp['38']) { // up arrow key
                    this.isJumping = true;
                    this.dy -= this.playerJumpHeight;
                    this.y += this.dy + this.dy; // Move vertically
                }
            }

            // Y DIRECTION COLLISION //
            // Check if NOT sitting on a surface
            if(this.y + this.height < CANVAS_HEIGHT && !this.bottomCollision) {
                this.dy += this.gravity; // simulate gravity
                this.y += this.dy; // move vertically
                this.dy *= this.airResistance; // simulate air resistance
                this.isJumping = true; // player is in the air
            }
            else { // player sits on surface
                this.y -= this.dy; // stop player from falling through the floor
                this.isJumping = false; // stop jumping
                this.dy = 0; // clear previous gravity effects
            }

            // X DIRECTION COLLISION //
            // Stop player if not in screen boundaries
            if(!this.inBoundsX(0, CANVAS_WIDTH)) {
                // Check if on right boundary of screen
                if(this.x + this.width > CANVAS_WIDTH) {
                    // Only left key is usable
                    if(keysUp['37']) { // left arrow key
                        this.dx += this.playerSpeed;
                    }
                    this.x -= this.dx;
                    this.dx = 0;
                }
                // Check if on left boundary of screen
                if(this.x < 0) {
                    // Only right key is usable
                    if(keysUp['39']) { // right arrow key
                        // If in bounds, move right
                        this.dx -= this.playerSpeed;
                    }
                    this.x -= this.dx;
                    this.dx = 0;
                }
            }
            else {
                // Not touching bounds, so both left/right arrow keys are usable
                if(keysUp['37']) { // left arrow key
                    this.dx -= this.playerSpeed;
                }
                if(keysUp['39']) { // right arrow key
                    this.dx += this.playerSpeed;
                }
                this.x += this.dx; // move the player horizontally
                this.dx *= this.friction; // simulate friction
            }
        }

        // Check if sitting on an object
        onCollisonY(sprite) {
            // Y DIRECTION COLLISION //
            if(this.y + this.height < sprite.y + sprite.height) {
                this.bottomCollision = true;
            }
        }

        setHasObjectCollisionFalse() {
            this.bottomCollision = false;
        }
    }

    // Timer class sets intervals at which functions are called
    // Params: obj (the object that you're calling the function from)
    //         funct (the function that will be called)
    class Timer {
        constructor(obj, func) {
            this.delay = obj.delay * 1000; // change from seconds to milliseconds
            this.obj = obj;
            this.func = func;
            // Store interval id from setInterval()
            this.interval = setInterval(this.func, this.delay, this.obj);
        }

        // Starts timer by setting interval
        startTimer() {
            if(this.intervalIsNull()) {
                this.interval = setInterval(this.func, this.delay, this.obj);
            }
        }

        // Stops timer by clearing inteval
        stopTimer() {
            if(!this.intervalIsNull()) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }

        // Check if the interval is null or not
        intervalIsNull() {
            if(!this.interval) {
                return true;
            }
            return false;
        }
    }

    /* ----------- LOOSE CODE START ----------- */

    // GLOBAL VARIABLES //
    const canvas = document.getElementById("canvas");
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 480;
    const PLATFORM_WIDTH = 200;
    const PLATFORM_HEIGHT = 15;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.alignContent = "center";
    let player = new Player(50, 50, 10, 10);
    let platform = new Platform(PLATFORM_WIDTH, PLATFORM_HEIGHT, 
        10, CANVAS_HEIGHT-10);
    let platform2 = new Platform(PLATFORM_WIDTH, PLATFORM_HEIGHT, 
        400, 300);
    let sprites = new Array(player, platform, platform2);

    // Initialize the scene
    let scene = new Scene(CANVAS_WIDTH, CANVAS_HEIGHT, sprites, 0.01, 0);
    scene.start();

    // Global functions that check for key state
    function keyPressed(e) {
        scene.setKeyUpState(true, e.keyCode);
    }
    function keyReleased(e) {
        scene.setKeyUpState(false, e.keyCode);
    }
    function mousePressed(e) {
        // Create a platform in the middle of where you clicked
        scene.addSprite(new Platform(PLATFORM_WIDTH, PLATFORM_HEIGHT, 
            e.clientX - canvas.offsetLeft - PLATFORM_WIDTH/2, 
            e.clientY - canvas.offsetTop - PLATFORM_HEIGHT/2));
    }

    /* ----------- LOOSE CODE END ----------- */
});
