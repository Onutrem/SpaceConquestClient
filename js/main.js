var socket;

var username;

var canvas;
var context;

var mapCanvas;
var mapContext;

var scaleWidth = window.innerWidth / 1920;
var scaleHeight = window.innerHeight / 950;

var images = {};

//Quand le site est chargé
$(function () {

    loadRessources();

    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext("2d");
    
    mapCanvas = document.getElementById("mapCanvas");
    mapCanvas.width = 150;
    mapCanvas.height = 150;
    mapContext = mapCanvas.getContext("2d");
    mapContext.fillStyle = 'red';

    //Récupération du formulaire de connexion
    $("#playForm").submit(function (e) {
        e.preventDefault();
        initNetworking();
        username = $('#playUsername').val();
        $('#playBtn').prop('disabled', true);
        joinGame();
    });

    canvas.addEventListener('mousemove', function (evt) {
        updateMousePos(evt);
    }, false);

    $(document).mousedown(function (event) {
        if (event.which === 1) {
            fireOn = true;
        }

        if (event.which === 3)
        {
            mouseLocked = true;
        }
    });

    $(document).mouseup(function (event) {
        if (event.which === 1) {
            fireOn = false;
        }

        if (event.which === 3)
        {
            mouseLocked = false;
        }
    });

    $(document).keydown(function (event) {
        if (event.which === 32)
        {
            boost = true;
        }
    });
    
    $(document).keyup(function (event) {
        if (event.which === 32)
        {
            boost = false;
        }
    });

    $(window).resize(function () {
        scaleWidth = window.innerWidth / 1920;
        scaleHeight = window.innerHeight / 950;
    });

});

//Ressources
function loadRessources() {
    addImage("star", 28, 28);
    addImage("blueShip", 42, 52);
    addImage("redShip", 42, 52);
    addImage("blueLaser", 19, 7);
    addImage("redLaser", 19, 7);
    addImage("explosion", 1920, 96);
    addImage("bigAsteroid", 101, 84);
    addImage("mediumAsteroid", 43, 43);
    addImage("blackHole", 150, 150);
}

function addImage(imageName, width, height) {
    var image = new Image(width, height);
    image.src = "game/ressources/images/" + imageName + ".png";
    images[imageName] = image;
}

//Envoi de données au serveur

function joinGame() {
    socket.emit('joinGame', {username: username});
}




