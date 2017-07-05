/* global UPDATE_TICKRATE, canvas, socket, drawDelta, images */

var BlackHole = function (id, x, y) {

    this.id = id;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.image = images['blackHole'];

    this.rotationAnimationStep = 0;

    this.draw = function (ctx) {

        this.rotationAnimationStep += drawDelta;

        if (this.rotationAnimationStep >= 10) {
            this.rotationAnimationStep = 0;
            this.angle++;
        }
        
        var centerOfRotationX = this.x + this.image.width / 2;
        var centerOfRotationY = this.y + this.image.height / 2;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(centerOfRotationX, centerOfRotationY);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.translate(-centerOfRotationX, -centerOfRotationY);
        ctx.drawImage(this.image, this.x, this.y);
        ctx.restore();
    };

};