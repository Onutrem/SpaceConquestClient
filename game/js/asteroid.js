/* global UPDATE_TICKRATE, canvas, socket, stars, drawDelta, images */

var Asteroid = function (id, x, y, angle, type) {

    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.lastUpdate = Date.now();
    this.image = images[type];

    this.oldX = x;
    this.oldY = y;
    this.oldAngle = angle;
    this.oldUpdate = Date.now();

    this.update = function (x, y, angle) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldAngle = this.angle;
        this.oldUpdate = this.lastUpdate;

        this.x = x;
        this.y = y;
        this.angle = angle;
        this.lastUpdate = Date.now();
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
        ctx.translate(centerOfRotationX, centerOfRotationY);
        ctx.rotate(interpAngle * Math.PI / 180);
        ctx.translate(-centerOfRotationX, -centerOfRotationY);
        ctx.drawImage(this.image, interpX, interpY);
        ctx.restore();

    };

};