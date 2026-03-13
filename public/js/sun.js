const sun = document.getElementById('Sun');
const sunReflection = document.getElementById('SunReflection');
const sizeX = window.innerWidth;
const sizeY = window.innerHeight;

const horizonY = sizeY * 0.53;  // ligne d'horizon en pixels
const radiusX = sizeX * 0.4;    // demi-largeur de l'ellipse
const radiusY = sizeY * 0.40;   // hauteur de l'arc dans le ciel
const centerX = sizeX / 2;      // centre horizontal = milieu de l'écran
const speed = 0.008;             // radians par frame

let angle = 0;

function animateSun() {
    const posX = centerX - radiusX * Math.cos(angle);
    const posY = horizonY - radiusY * Math.sin(angle);

    // Soleil
    sun.style.left = posX + 'px';
    sun.style.top  = posY + 'px';

    // Réflexion : symétrie axiale par rapport à l'horizon
    // Le container commence à horizonY, donc on décale en conséquence
    sunReflection.style.left = posX + 'px';
    sunReflection.style.top  = (horizonY - posY) + 'px';

    angle += speed;

    requestAnimationFrame(animateSun);
}

requestAnimationFrame(animateSun);
