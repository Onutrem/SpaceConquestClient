/* global UPDATE_TICKRATE, canvas, socket, stars, drawDelta */

var Bullet = function (id, x, y, angle, distance, maxDistance, image) {

    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.image = image;
    this.lastUpdate = Date.now();

    this.oldX = x;
    this.oldY = y;
    this.oldAngle = angle;
    this.oldUpdate = Date.now();

    this.distance = distance;
    this.maxDistance = maxDistance;

    this.deathAnimationStep = 0;

    this.update = function (x, y, angle, distance) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldAngle = this.angle;
        this.oldUpdate = this.lastUpdate;

        this.x = x;
        this.y = y;
        this.angle = angle;
        this.lastUpdate = Date.now();
        this.distance = distance;

    };

    this.draw = function (ctx) {
        this.drawEntityInterpolation(ctx);
    };

    this.drawEntityInterpolation = function (ctx) {
        var now = Date.now();
        var tickLength = 1000 / UPDATE_TICKRATE;

        var elapsed = now - this.oldUpdate - tickLength;
        var interpX = lerp(this.oldX, this.x, elapsed / tickLength);
        var interpY = lerp(this.oldY, this.y, elapsed / tickLength);
        var interpAngle = lerpDegrees(this.oldAngle, this.angle, elapsed / tickLength);
        var centerOfRotationX = interpX + this.image.width / 2;
        var centerOfRotationY = interpY + this.image.height / 2;

        ctx.save();
        if (this.distance >= this.maxDistance) {
            this.deathAnimationStep += drawDelta;
            var opacity = 1 - (this.deathAnimationStep / 100);
            if (opacity > 0) {
                ctx.globalAlpha = opacity;
            }
            else {
                ctx.globalAlpha = 0.1;
            }
        }

        ctx.translate(centerOfRotationX, centerOfRotationY);
        ctx.rotate(interpAngle * Math.PI / 180);
        ctx.translate(-centerOfRotationX, -centerOfRotationY);
        ctx.drawImage(this.image, interpX, interpY);
        ctx.restore();

    };

};