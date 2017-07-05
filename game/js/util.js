function lerp(a, b, c) {
    return a + c * (b - a);
}

function lerpDegrees(start, end, amount) {
    var difference = Math.abs(end - start);
    if (difference > 180)
    {
        // We need to add on to one of the values.
        if (end > start)
        {
            // We'll add it on to start...
            start += 360;
        } else {
            // Add it on to end.
            end += 360;
        }
    }

    // Interpolate it.
    var value = (start + ((end - start) * amount));

    // Wrap it..
    var rangeZero = 360;

    if (value >= 0 && value <= 360) {
        return value;
    }

    return (value % rangeZero);
}

function randomInt(min, max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}