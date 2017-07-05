/* global UPDATE_TICKRATE, canvas, socket, stars, drawDelta, images */

var colors = ['#f00000', '#f06500', '#f0a300', '#f0ea00', '#a1f000', '#43f000', '#00f031', '#00f08f',
    '#00e4f0', '#008ff0', '#0039f0', '#1d00f0', '#8200f0', '#ef00f0', '#f0007d'];

var Star = function (id, x, y) {

    this.id = id;
    this.x = x;
    this.y = y;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.spawnAnimationStep = 0;

    this.draw = function (ctx) {

        if (this.spawnAnimationStep < 300) {
            this.spawnAnimationStep += drawDelta;
        }

        var spikes = 8;
        var outerRadius = 5;
        var innerRadius = 3;
        var rot = Math.PI / 2 * 3;
        var x = this.x;
        var y = this.y;
        var step = Math.PI / spikes;

        ctx.globalAlpha = this.spawnAnimationStep / 300;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - outerRadius);
        for (var i = 0; i < spikes; i++) {
            x = this.x + Math.cos(rot) * outerRadius;
            y = this.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = this.x + Math.cos(rot) * innerRadius;
            y = this.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(this.x, this.y - outerRadius);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;

    };

};