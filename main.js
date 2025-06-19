// Canvas setup
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var loading_screen = document.getElementById('loading');

// Load tracking
var load_counter = 0;

// Image layers
var background = new Image();
var creatures = new Image();
var castle = new Image();
var boys = new Image();

var layer_list = [
    { image: background, src: 'layer1.png', z_index: -5, position: { x: 0, y: 0 }, blend: null, opacity: 1 },
    { image: creatures, src: 'layer2.png', z_index: -4, position: { x: 0, y: 0 }, blend: null, opacity: 1 },
    { image: castle, src: 'layer3.png', z_index: -2, position: { x: 0, y: 0 }, blend: 'normal', opacity: 1 },
    { image: boys, src: 'layer4.png', z_index: -0.5, position: { x: 0, y: 0 }, blend: 'source-over', opacity: 1 }
];

// Sprite sheet (Layer 5 as topmost animated layer)
var sprite = new Image();
sprite.src = "layer5-sprite.png";
var currentFrame = 0;
var totalFrames = 70;
var frameWidth = 820;
var frameHeight = 1125;
var frameDuration = 100;
var lastFrameTime = Date.now();
var spriteZ = 2; // high value to render on top

// Load images
layer_list.forEach(layer => {
    layer.image.onload = () => {
        load_counter++;
        if (load_counter === layer_list.length) {
            hideLoading();
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

// Loading screen
function hideLoading() {
    loading_screen.classList.add('hidden');
}

// Main draw loop
function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    TWEEN.update();

    // Tilt canvas
    var rotate_x = (pointer.y * -0.15) + (motion.y * -1.2);
    var rotate_y = (pointer.x * 0.15) + (motion.x * 1.2);
    canvas.style.transform = `rotateX(${rotate_x}deg) rotateY(${rotate_y}deg)`;

    // Draw each static image layer
    layer_list.forEach(layer => {
        layer.position = getOffset(layer.z_index);
        context.globalAlpha = layer.opacity;
        context.globalCompositeOperation = layer.blend || 'source-over';
        context.drawImage(layer.image, layer.position.x, layer.position.y);
    });

    // Advance sprite frame
    var now = Date.now();
    if (now - lastFrameTime > frameDuration) {
        currentFrame = (currentFrame + 1) % totalFrames;
        lastFrameTime = now;
    }

    // Draw sprite with parallax
    var spriteOffset = getOffset(spriteZ);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.drawImage(
        sprite,
        currentFrame * frameWidth, 0,
        frameWidth, frameHeight,
        spriteOffset.x, spriteOffset.y,
        frameWidth, frameHeight
    );

    requestAnimationFrame(drawCanvas);
}

// Offset for parallax
function getOffset(z_index) {
    var touch_multiplier = 0.09;
    var motion_multiplier = 2;
    return {
        x: pointer.x * z_index * touch_multiplier + motion.x * z_index * motion_multiplier,
        y: pointer.y * z_index * touch_multiplier + motion.y * z_index * motion_multiplier
    };
}

// Pointer + motion setup
var pointer_initial = { x: 0, y: 0 };
var pointer = { x: 0, y: 0 };
var motion_initial = { x: null, y: null };
var motion = { x: 0, y: 0 };
var moving = false;

canvas.addEventListener('touchstart', pointerStart);
canvas.addEventListener('mousedown', pointerStart);

function pointerStart(e) {
    moving = true;
    if (e.type === 'touchstart') {
        pointer_initial.x = e.touches[0].clientX;
        pointer_initial.y = e.touches[0].clientY;
    } else {
        pointer_initial.x = e.clientX;
        pointer_initial.y = e.clientY;
    }
}

window.addEventListener('touchmove', pointerMove);
window.addEventListener('mousemove', pointerMove);

function pointerMove(e) {
    e.preventDefault();
    if (moving) {
        var x = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
        var y = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;
        pointer.x = x - pointer_initial.x;
        pointer.y = y - pointer_initial.y;
    }
}

window.addEventListener('mouseup', endGesture);
window.addEventListener('touchend', () => { endGesture(); enableMotion(); });

function endGesture() {
    moving = false;
    TWEEN.removeAll();
    new TWEEN.Tween(pointer).to({ x: 0, y: 0 }, 300).easing(TWEEN.Easing.Back.Out).start();
}

// Motion controls
window.addEventListener('deviceorientation', e => {
    if (!motion_initial.x && !motion_initial.y) {
        motion_initial.x = e.beta;
        motion_initial.y = e.gamma;
    }

    if (window.orientation === 0) {
        motion.x = e.gamma - motion_initial.y;
        motion.y = e.beta - motion_initial.x;
    } else if (window.orientation === 90) {
        motion.x = e.beta - motion_initial.x;
        motion.y = -e.gamma + motion_initial.y;
    } else if (window.orientation === -90) {
        motion.x = -e.beta + motion_initial.x;
        motion.y = e.gamma - motion_initial.y;
    } else {
        motion.x = -e.gamma + motion_initial.y;
        motion.y = -e.beta + motion_initial.x;
    }
});

window.addEventListener('orientationchange', () => {
    motion_initial.x = 0;
    motion_initial.y = 0;
});

function enableMotion() {
    if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission().catch(() => { });
    }
}
