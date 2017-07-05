/* global drawDelta */

var Sprite = function (imageSheet, x, y, frames, framesPerSeconds) {
    
    this.imageSheet = imageSheet;
    this.x = x;
    this.y = y;
    this.frames = frames;
    this.framesPerSeconds = framesPerSeconds;
    
    this.animationStep = 0;
    this.frameNumber = 1;
    this.complete = false;
    
    this.render = function(ctx) {
        
        this.animationStep += drawDelta;

        ctx.drawImage(
            this.imageSheet, 
            this.imageSheet.width / this.frames * this.frameNumber,
            0,
            this.imageSheet.width / this.frames,
            this.imageSheet.height,
            this.x,
            this.y,
            this.imageSheet.width / this.frames,
            this.imageSheet.height
        );
        
        if (this.animationStep >= this.frameNumber * this.framesPerSeconds * 1000) {
            if (this.frameNumber < this.frames) {
                this.frameNumber++;
            }
            else {
                this.complete = true;
            }
        }
        
    };
    
    
};