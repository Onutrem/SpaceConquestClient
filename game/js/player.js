/* global UPDATE_TICKRATE, canvas, socket, stars, MAP_SIZE, drawDelta, scaleWidth, scaleHeight, images, data, explosions */

var Player = function (id, username, x, y, angle, hp, maxHp, level, image, xPoints, yPoints) {

    this.id = id;
    this.username = username;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.image = image;
    this.lastUpdate = Date.now();

    this.oldX = x;
    this.oldY = y;
    this.oldAngle = angle;
    this.oldUpdate = Date.now();

    this.alive = true;
    this.hp = hp;
    this.maxHp = maxHp;

    this.level = level;
    this.xp = 0;
    this.maxXp = 100;

    //Boost
    this.boostValue = 0;
    this.maxBoost = 3000;

    this.invulnerable = false;

    //Animation 
    this.interpX = x;
    this.interpY = y;
    this.interpAngle = angle;
    this.flashAnimation = false;
    this.flashAnimationDuration = 0;
    this.flashAnimationStep = 0;
    this.flashColor = '#8a0000';

    this.xPoints = xPoints;
    this.yPoints = yPoints;

    this.update = function (x, y, angle, hp, maxHp, level, xp, maxXp, boostValue, maxBoost, alive, invulnerable, xPoints, yPoints) {

        if (this.id === socket.id) {

            if (this.hp > hp) {
                this.flashColor = '#8a0000';
                this.flashAnimationDuration = 300;
                this.flashAnimation = true;
                this.flashAnimationStep = 0;
            }

            //Si la différence de position est très grande, on flash noir
            var a = this.x - x;
            var b = this.y - y;
            var distance = Math.sqrt(a * a + b * b);

            if (distance > MAP_SIZE / 7) {
                this.flashColor = '#000';
                this.flashAnimationDuration = 1000;
                this.flashAnimation = true;
                this.flashAnimationStep = 0;
            }
            
            if (this.alive !== alive) {
                $('#gameOver').fadeIn(500);
            }

            $('#interfaceHp').html(hp);
            $('#interfaceMaxHp').html(maxHp);
            $("#interfaceLevel").html(level);
            $("#interfaceXp").html(xp);
            $("#interfaceMaxXp").html(maxXp);
            $("#interfaceBoost").html(Math.floor(maxBoost - boostValue));
            $("#interfaceMaxBoost").html(maxBoost);
        }

        this.oldX = this.x;
        this.oldY = this.y;
        this.oldAngle = this.angle;
        this.oldUpdate = this.lastUpdate;

        this.x = x;
        this.y = y;
        this.angle = angle;
        this.lastUpdate = Date.now();

        this.alive = alive;
        this.hp = hp;
        this.maxHp = maxHp;

        this.boostValue = boostValue;
        this.maxBoost = maxBoost;

        this.level = level;
        this.xp = xp;
        this.maxXp = maxXp;
        this.invulnerable = invulnerable;

        this.xPoints = xPoints;
        this.yPoints = yPoints;

    };


    this.updateEntityInterpolation = function () {
        var now = Date.now();
        var tickLength = 1000 / UPDATE_TICKRATE;

        var elapsed = now - this.oldUpdate - tickLength;
        this.interpX = lerp(this.oldX, this.x, elapsed / tickLength);
        this.interpY = lerp(this.oldY, this.y, elapsed / tickLength);
        this.interpAngle = lerpDegrees(this.oldAngle, this.angle, elapsed / tickLength);
    };

    //Joueur
    this.drawPlayer = function (ctx) {

        if (this.alive) {
            var centerOfRotationX = this.interpX + this.image.width / 2;
            var centerOfRotationY = this.interpY + this.image.height / 2;

            ctx.save();
            if (this.invulnerable) {
                ctx.globalAlpha = 0.5;
            }
            ctx.translate(centerOfRotationX, centerOfRotationY);
            ctx.rotate(this.interpAngle * Math.PI / 180);
            ctx.translate(-centerOfRotationX, -centerOfRotationY);
            ctx.drawImage(this.image, this.interpX, this.interpY);
            ctx.restore();
        }
    };

    //HitBox

    this.drawHitBox = function (ctx) {

        //Hitbox
        ctx.lineWidth = 3;
        ctx.lineStyle = 'cyan';
        ctx.beginPath();
        for (var i = 0; i < this.xPoints.length; i++) {

            var x = this.xPoints[i];
            var y = this.yPoints[i];

            if (i < this.xPoints.length - 1) {
                var nextX = this.xPoints[i + 1];
                var nextY = this.yPoints[i + 1];
                ctx.moveTo(x, y);
                ctx.lineTo(nextX, nextY);
            } else {
                ctx.moveTo(x, y);
                ctx.lineTo(this.xPoints[0], this.yPoints[0]);
            }

        }
        ctx.stroke();
    };

    //Vie
    this.drawLife = function (ctx) {
        if (this.alive) {
            var lifeWidth = this.image.height - 10;
            var lifeHeight = 3;

            //Background
            ctx.fillStyle = 'red';
            ctx.fillRect(this.interpX + 5, this.interpY + this.image.height + 5, lifeWidth, lifeHeight);

            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.interpX + 5, this.interpY + this.image.height + 5, this.hp / this.maxHp * lifeWidth, lifeHeight);
        }
    };

    //Xp
    this.drawXp = function (ctx) {
        if (this.alive) {
            var xpWidth = this.image.height;
            var xpHeight = 3;

            //Background
            ctx.fillStyle = '#004a68';
            ctx.fillRect(this.interpX - 5, this.interpY + this.image.height + 13, xpWidth, xpHeight);

            ctx.fillStyle = '#00b8ff';
            ctx.fillRect(this.interpX - 5, this.interpY + this.image.height + 13, this.xp / this.maxXp * xpWidth, xpHeight);
        }
    };

    //Boost
    this.drawBoost = function (ctx) {
        if (this.alive) {
            var boostWidth = this.image.height;
            var boostHeight = 3;

            //Background1
            ctx.fillStyle = '#008606';
            ctx.fillRect(this.interpX - 5, this.interpY + this.image.height + 21, boostWidth, boostHeight);

            ctx.fillStyle = '#00f00a';
            ctx.fillRect(this.interpX - 5, this.interpY + this.image.height + 21, (1 - this.boostValue / this.maxBoost) * boostWidth, boostHeight);
        }
    };



    //Pseudo
    this.drawUsername = function (ctx) {
        if (this.alive) {
            var textPosX = this.interpX - this.username.length;
            var textPosY = this.interpY - 5;

            ctx.font = '16px Impact';
            if (socket.id === this.id) {
                ctx.strokeStyle = 'blue';
            } else {
                ctx.strokeStyle = 'red';
            }
            ctx.fillStyle = 'white';
            ctx.fillText(this.username, textPosX, textPosY);
        }
    };

    //Level
    this.drawLevel = function (ctx) {
        if (this.alive) {
            var textPosX;
            var textPosY = this.interpY + this.image.height + 10;

            if (this.level >= 30) {
                textPosX = this.interpX - 20;
                ctx.font = '20px Impact';
                ctx.fillStyle = '#ff3131';
            } else if (this.level >= 25) {
                textPosX = this.interpX - 18;
                ctx.font = '19px Impact';
                ctx.fillStyle = '#ff9531';
            } else if (this.level >= 20) {
                textPosX = this.interpX - 16;
                ctx.font = '18px Impact';
                ctx.fillStyle = '#ffd831';
            } else if (this.level >= 15) {
                textPosX = this.interpX - 14;
                ctx.font = '17px Impact';
                ctx.fillStyle = '#5eff31';
            } else if (this.level >= 10) {
                textPosX = this.interpX - 12;
                ctx.font = '16px Impact';
                ctx.fillStyle = '#31ff83';
            } else if (this.level >= 5) {
                textPosX = this.interpX - 7;
                ctx.font = '15px Impact';
                ctx.fillStyle = '#31f4ff';
            } else {
                textPosX = this.interpX - 5;
                ctx.font = '14px Impact';
                ctx.fillStyle = '#0096f5';
            }

            ctx.fillText(this.level, textPosX, textPosY);
        }
    };

    //Grille
    this.drawGrid = function (ctx) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.10;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();

        for (var x = -this.interpX; x < canvas.width / scaleWidth; x += canvas.height / 18) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height / scaleHeight);
        }

        for (var y = -this.interpY; y < canvas.height / scaleWidth; y += canvas.height / 18) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width / scaleWidth, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    };

    //Limites
    this.drawLimits = function (ctx) {
        ctx.strokeStyle = 'cyan';
        ctx.globalAlpha = 0.3;

        if (this.interpX <= canvas.width / 2 / scaleWidth) {
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2 / scaleWidth - this.interpX, 0 ? this.interpY > canvas.height / 2 / scaleHeight : canvas.height / 2 / scaleHeight - this.interpY);
            ctx.lineTo(canvas.width / 2 / scaleWidth - this.interpX, MAP_SIZE + canvas.height / 2 / scaleHeight - this.interpY);
            ctx.stroke();
        }

        if (this.interpY <= canvas.height / 2 / scaleHeight) {
            ctx.beginPath();
            ctx.moveTo(0 ? this.interpX > canvas.width / 2 / scaleWidth : canvas.width / 2 / scaleWidth - this.interpX, canvas.height / 2 / scaleHeight - this.interpY);
            ctx.lineTo(MAP_SIZE + canvas.width / 2 / scaleWidth - this.interpX, canvas.height / 2 / scaleHeight - this.interpY);
            ctx.stroke();
        }

        if (MAP_SIZE - this.interpX <= canvas.width / 2 / scaleWidth) {
            ctx.beginPath();
            ctx.moveTo(MAP_SIZE + canvas.width / 2 / scaleWidth - this.interpX,
                    canvas.height / 2 / scaleHeight - this.interpY);
            ctx.lineTo(MAP_SIZE + canvas.width / 2 / scaleWidth - this.interpX,
                    MAP_SIZE + canvas.height / 2 / scaleHeight - this.interpY);
            ctx.stroke();
        }

        if (MAP_SIZE - this.interpY <= canvas.height / 2 / scaleHeight) {
            ctx.beginPath();
            ctx.moveTo(MAP_SIZE + canvas.width / 2 / scaleWidth - this.interpX,
                    MAP_SIZE + canvas.height / 2 / scaleHeight - this.interpY);
            ctx.lineTo(canvas.width / 2 / scaleWidth - this.interpX,
                    MAP_SIZE + canvas.height / 2 / scaleHeight - this.interpY);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    };

    //Flash
    this.drawFlashAnimation = function (ctx) {

        if (this.flashAnimation) {
            var duration = this.flashAnimationDuration;

            this.flashAnimationStep += drawDelta;

            if (this.flashAnimationStep < duration) {
                ctx.globalAlpha = 1 - this.flashAnimationStep / duration;
                ctx.fillStyle = this.flashColor;
                ctx.fillRect(this.interpX - canvas.width / 2 / scaleWidth, this.interpY - canvas.height / 2 / scaleHeight, canvas.width / scaleWidth, canvas.height / scaleHeight);
            } else {
                this.flashAnimation = false;
                this.flashAnimationStep = 0;
            }

            ctx.globalAlpha = 1;

        }

    };

};