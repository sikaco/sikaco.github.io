if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

//Make the canvas occupy the full page
var W = window.innerWidth, H = window.innerHeight;
canvas.width = W;
canvas.height = H;

var theBall = {
    'radius': 30,
    'x': 0,
    'y': 0,
    'yGravity': 0.001,
    'lambdaT': 22,
    'vX': 0,
    'vY': 0
};

var animation = {
    '_storyEventsBind': function () {

    },
    'start': function () {
        this._storyEventsBind();
        this._theBallInit();

        $('#startButton').removeClass('default');   //avoid was clicked again
        $('#startRound').addClass('startButtonAnimation').fadeOut(function () { //change the round
            animation._ballGravityMove();
        });
    },
    '_theBallInit': function() {
        theBall.x = window.innerWidth / 2;
        theBall.y = window.innerHeight / 2;
        this.ballDraw(theBall, 'white');
    },
    'stopFlag': false,
    '_ballGravityMove' : function () {
        theBall.vY += theBall.yGravity * theBall.lambdaT;
        theBall.y += theBall.vY * theBall.lambdaT;

        if (theBall.y + theBall.radius >= H) {
            theBall.y = H - theBall.radius;
            theBall.vY = -theBall.vY * 0.56;
            if (theBall.vY > -0.01 && theBall.vY < 0.01) {
                theBall.vY = 0;
                animation.stopFlag = true;
            }
        }
        animation.ballDraw(theBall, 'white');
        if (!animation.stopFlag) {
            animation.requestId = requestAnimationFrame(animation._ballGravityMove);
        } else {
            animation.requestId = undefined;
            setTimeout(function () {
                $('#bgm')[0].play();
                animation._colorfulFrame();
            }, 500);
        }
    },
    'ballDraw': function (b, fillStyle) {
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
        ctx.fill();
    },
    '_colorfulFlame': function () {

    },
    'frameDraw': function () {

    }
};


function canvasAnimation() {
    var particles = [];
    var mouse = {};

    //Lets create some particles now
    var particle_count = 100;
    for (var i = 0; i < particle_count; i++) {
        particles.push(new particle());
    }

    //finally some mouse tracking
    canvas.addEventListener('mousemove', track_mouse, false);

    function track_mouse(e) {
        //since the canvas = full page the position of the mouse
        //relative to the document will suffice
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }

    function particle() {
        //speed, life, location, life, colors
        //speed.x range = -2.5 to 2.5
        //speed.y range = -15 to -5 to make it move upwards
        //lets change the Y speed to make it look like a flame
        this.speed = {x: -2.5 + Math.random() * 5, y: -15 + Math.random() * 10};
        //location = mouse coordinates
        //Now the flame follows the mouse coordinates
        if (mouse.x && mouse.y) {
            this.location = {x: mouse.x, y: mouse.y};
        }
        else {
            this.location = {x: W / 2, y: H / 2};
        }
        //radius range = 10-30
        this.radius = 10 + Math.random() * 20;
        //life range = 20-30
        this.life = 20 + Math.random() * 10;
        this.remaining_life = this.life;
        //colors
        this.r = Math.round(Math.random() * 255);
        this.g = Math.round(Math.random() * 255);
        this.b = Math.round(Math.random() * 255);
    }

    function draw() {
        //Painting the canvas black
        //Time for lighting magic
        //particles are painted with "lighter"
        //In the next frame the background is painted normally without blending to the
        //previous frame
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.beginPath();
            //changing opacity according to the life.
            //opacity goes to 0 at the end of life of a particle
            p.opacity = Math.round(p.remaining_life / p.life * 100) / 100;
            //a gradient instead of white fill
            var gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
            gradient.addColorStop(0, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
            gradient.addColorStop(0.5, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.opacity + ")");
            gradient.addColorStop(1, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0)");
            ctx.fillStyle = gradient;
            ctx.arc(p.location.x, p.location.y, p.radius, Math.PI * 2, false);
            ctx.fill();

            //lets move the particles
            p.remaining_life--;
            p.radius--;
            p.location.x += p.speed.x;
            p.location.y += p.speed.y;

            //regenerate particles
            if (p.remaining_life < 0 || p.radius < 0) {
                //a brand new particle replacing the dead one
                particles[i] = new particle();
            }
        }
    }

    setInterval(draw, 33);
}