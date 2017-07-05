/* global context, canvas, socket, UPDATE_TICKRATE, DRAW_TICKRATE, scaleHeight, scaleWidth, images, mapCanvas, mapContext, io */

// Params
var debug = false;

//Constantes

var MAP_SIZE = 3000;
var UPDATE_TICKRATE = 20;


//Game
var players = {};
var bullets = {};
var asteroids = {};
var stars = {};
var blackHoles = {};

//Joueur
var mouseX;
var mouseY;
var mouseLocked = false;
var fireOn = false;
var boost = false;

//Animation
var loopId;
var updateDelta = 0;
var drawStep = 0;
var simulationStep = 0;
var previousUpdateTick = Date.now();
var previousDrawTick = Date.now();
var lastDrawTick = Date.now();
var drawDelta;

var explosions = [];

//Jeu

function startGame() {
    mouseLocked = false;
    fireOn = false;
    boost = false;
    players = {};
    bullets = {};
    asteroids = {};
    stars = {};
    blackHoles = {};
    $('#homeContainer').hide();
    $('#gameOver').hide();
    $('#gameContainer').fadeIn(500);
    if (loopId === undefined) {
        loopId = window.requestAnimationFrame(gameLoop);
    }
}

function gameLoop() {
    var now = Date.now();

    if (previousUpdateTick + 1000 / UPDATE_TICKRATE < now) {
        updateDelta = (now - previousUpdateTick) / 1000;
        previousUpdateTick = now;
        simulationStep++;
        update();
    }

    previousDrawTick = lastDrawTick;
    lastDrawTick = now;
    drawDelta = lastDrawTick - previousDrawTick;

    draw();
    window.requestAnimationFrame(gameLoop);

}

function draw() {

    context.clearRect(20, 20, mapCanvas.width, mapCanvas.height);
    mapContext.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context.scale(window.innerWidth / 1920, window.innerHeight / 950);

    //Players
    for (var key in players) {
        players[key].updateEntityInterpolation();
    }

    //Grid / Limits / Camera
    var you = players[socket.id];
    if (you !== undefined) {
        //Grille
        you.drawGrid(context);

        //Limites
        you.drawLimits(context);

        //Caméra
        context.translate(-you.interpX + canvas.width / 2 / scaleWidth, -you.interpY + canvas.height / 2 / scaleHeight);

        //Map
        mapContext.fillRect((you.interpX / MAP_SIZE) * mapCanvas.width - 2.5, (you.interpY / MAP_SIZE) * mapCanvas.height - 2.5, 5, 5);
    }

    //BlackHoles
    for (var key in blackHoles) {
        blackHoles[key].draw(context);
    }

    //Stars
    for (var key in stars) {
        stars[key].draw(context);
    }

    //Players
    for (var key in players) {
        players[key].drawPlayer(context);
    }

    //Asteroids
    for (var key in asteroids) {
        asteroids[key].draw(context);
    }

    //Bullets
    for (var key in bullets) {
        bullets[key].draw(context);
    }

    for (var i = explosions.length - 1; i >= 0; i--) {
        if (explosions[i].complete) {
            explosions.splice(i, 1);
        } else {
            explosions[i].render(context);
        }
    }

    //UI
    //Players
    for (var key in players) {
        players[key].drawUsername(context);
        players[key].drawLife(context);
        players[key].drawLevel(context);
        if (debug) {
            players[key].drawHitBox(context);
        }

        if (players[key].id === socket.id) {
            players[key].drawXp(context);
            players[key].drawBoost(context);
            players[key].drawFlashAnimation(context);
        }
    }
}

function update() {

    //Envoi de la position de la souris
    var you = players[socket.id];
    if (you !== undefined) {
        moveMouse(mouseX + you.x - window.innerWidth / 2 / scaleWidth, mouseY + you.y - window.innerHeight / 2 / scaleHeight);
    }

    if (fireOn) {
        fire();
    }

}

//Position de la souris
function updateMousePos(evt) {
    var rect = canvas.getBoundingClientRect();
    mouseX = (evt.clientX - rect.left) / scaleWidth;
    mouseY = (evt.clientY - rect.top) / scaleHeight;
}

//Réception

function initNetworking() {

    if (socket === undefined) {
        //Connexion au serveur de websocket
        if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
            socket = io.connect('http://spaceconquest.io:3000');
        } else {
            socket = io.connect('http://localhost:3000');
        }

        socket.on('joinGame', function (data) {
            startGame();
            $('#playBtn').prop('disabled', false);
            var remotePlayer = data;
            players[remotePlayer.id] = new Player(remotePlayer.id, remotePlayer.username,
                    remotePlayer.x, remotePlayer.y, remotePlayer.angle, remotePlayer.hp, remotePlayer.maxHp,
                    remotePlayer.level, images['blueShip'], remotePlayer.xPoints, remotePlayer.yPoints);
            $('#interfaceUsername').html(remotePlayer.username);
        });

        socket.on('addExplosion', function (data) {
            var remotePlayer = data;
            explosions.push(new Sprite(images['explosion'], remotePlayer.x - images['redShip'].width / 2, remotePlayer.y - images['redShip'].height / 2, 20, 0.05));
        });

        socket.on('updateLeaderboard', function (data) {

            $('#leaderboard').empty();
            
            var bestPlayers = data;

            bestPlayers.sort(function (p1, p2) {
                return p2.score - p1.score;
            });

            var isInTheTop = false;

            var i = 0;

            while (i < 10 && i < bestPlayers.length) {
                var player = bestPlayers[i];

                if (player.id !== socket.id) {
                    $('#leaderboard').append('<p>' + (i + 1) + '. ' + player.username + '</p>');
                } else {
                    $('#leaderboard').append('<p class="green">' + (i + 1) + '. ' + player.username + '</p>');
                    isInTheTop = true;
                }

                i++;
            }

            if (!isInTheTop && bestPlayers.indexOf(socket.id) > -1) {
                var pos = i;
                i = 0;
                while (pos === 0) {
                    if (bestPlayers[i].id === socket.id) {
                        pos = i + 1;
                    }
                    i++;
                }
                $('#leaderboard').append('<p class="green">' + pos + '. ' + player.username + '</p>');
            }

        });

        socket.on('disconnect', function () {
            location.reload();
        });

        //<editor-fold defaultstate="collapsed" desc="updateEntities">
        socket.on('updateEntities', function (data) {

            var remotePlayers = data.players;

            //On supprime les joueurs qui n'apparaissent pas
            for (var key in players) {

                var player = players[key];
                var isIn = false;
                for (var i = 0; i < remotePlayers.length; i++) {
                    if (remotePlayers[i].id === player.id) {
                        isIn = true;
                    }
                }

                if (!isIn) {
                    delete players[key];
                }

            }

            //Pour chaque joueur reçu, si il existe on l'update, sinon on l'ajoute
            for (var i = 0; i < remotePlayers.length; i++) {
                var remotePlayer = remotePlayers[i];
                if (players[remotePlayer.id] !== undefined) {
                    players[remotePlayer.id].update(remotePlayer.x, remotePlayer.y, remotePlayer.angle,
                            remotePlayer.hp, remotePlayer.maxHp, remotePlayer.level, remotePlayer.xp, remotePlayer.maxXp,
                            remotePlayer.boostValue, remotePlayer.maxBoost, remotePlayer.alive, remotePlayer.invulnerable,
                            remotePlayer.xPoints, remotePlayer.yPoints);
                } else {
                    players[remotePlayer.id] = new Player(remotePlayer.id, remotePlayer.username,
                            remotePlayer.x, remotePlayer.y, remotePlayer.angle, remotePlayer.hp,
                            remotePlayer.maxHp, remotePlayer.level, images['redShip'],
                            remotePlayer.xPoints, remotePlayer.yPoints);
                }
            }


            var remoteBullets = data.bullets;

            //On supprime les bullets qui n'apparaissent pas
            for (var key in bullets) {

                var bullet = bullets[key];
                var isIn = false;
                for (var i = 0; i < remoteBullets.length; i++) {
                    if (remoteBullets[i].id === bullet.id) {
                        isIn = true;
                    }
                }

                if (!isIn) {
                    delete bullets[key];
                }

            }

            //Pour chaque bullet reçu, si il existe on l'update, sinon on l'ajoute
            for (var i = 0; i < remoteBullets.length; i++) {
                var remoteBullet = remoteBullets[i];
                if (bullets[remoteBullet.id] !== undefined) {
                    bullets[remoteBullet.id].update(remoteBullet.x, remoteBullet.y, remoteBullet.angle, remoteBullet.distance);
                } else {
                    var imageName = 'redLaser';

                    if (socket.id === remoteBullet.ownerId) {
                        imageName = 'blueLaser';
                    }

                    bullets[remoteBullet.id] = new Bullet(remoteBullet.id, remoteBullet.x, remoteBullet.y, remoteBullet.angle,
                            remoteBullet.distance, remoteBullet.maxDistance, images[imageName]);
                }
            }

            var remoteAsteroids = data.asteroids;

            //On supprime les asteroids qui n'apparaissent pas
            for (var key in asteroids) {

                var asteroid = asteroids[key];
                var isIn = false;
                for (var i = 0; i < remoteAsteroids.length; i++) {
                    if (remoteAsteroids[i].id === asteroid.id) {
                        isIn = true;
                    }
                }

                if (!isIn) {
                    delete asteroids[key];
                }

            }

            //Pour chaque asteroid reçu, si il existe on l'update, sinon on l'ajoute
            for (var i = 0; i < remoteAsteroids.length; i++) {
                var remoteAsteroid = remoteAsteroids[i];
                if (asteroids[remoteAsteroid.id] !== undefined) {
                    asteroids[remoteAsteroid.id].update(remoteAsteroid.x, remoteAsteroid.y, remoteAsteroid.angle);
                } else {
                    asteroids[remoteAsteroid.id] = new Asteroid(remoteAsteroid.id, remoteAsteroid.x, remoteAsteroid.y, remoteAsteroid.angle, remoteAsteroid.type);
                }
            }


            var remoteStars = data.stars;

            //On supprime les étoiles qui n'apparaissent pas
            for (var key in stars) {

                var star = stars[key];
                var isIn = false;
                for (var i = 0; i < remoteStars.length; i++) {
                    if (remoteStars[i].id === star.id) {
                        isIn = true;
                    }
                }

                if (!isIn) {
                    delete stars[key];
                }

            }

            //Pour chaque étoile reçue, si il existe on l'update, sinon on l'ajoute
            for (var i = 0; i < remoteStars.length; i++) {
                var remoteStar = remoteStars[i];
                if (stars[remoteStar.id] === undefined) {
                    stars[remoteStar.id] = new Star(remoteStar.id, remoteStar.x, remoteStar.y);
                }
            }

            var remoteBlackHoles = data.blackHoles;

            //On supprime les trous noirs qui n'apparaissent pas
            for (var key in blackHoles) {

                var blackHole = blackHoles[key];
                var isIn = false;
                for (var i = 0; i < remoteBlackHoles.length; i++) {
                    if (remoteBlackHoles[i].id === blackHole.id) {
                        isIn = true;
                    }
                }

                if (!isIn) {
                    delete blackHoles[key];
                }

            }

            //Pour chaque trou noir reçue, si il existe on l'update, sinon on l'ajoute
            for (var i = 0; i < remoteBlackHoles.length; i++) {
                var remoteBlackHole = remoteBlackHoles[i];
                if (blackHoles[remoteBlackHole.id] === undefined) {
                    blackHoles[remoteBlackHole.id] = new BlackHole(remoteBlackHole.id, remoteBlackHole.x, remoteBlackHole.y);
                }
            }
        });
        //</editor-fold>
    }
}

//Envoi de données au serveur
function fire() {
    socket.emit('fire');
}

function moveMouse(x, y) {
    socket.emit('moveMouse', {x: x, y: y, mouseLocked: mouseLocked, boost: boost});
}

