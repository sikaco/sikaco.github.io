if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
//var bgCanvas = document.getElementById("bgCanvas");
//var bgCtx = bgCanvas.getContext("2d");

//Make the canvas occupy the full page
var W = window.innerWidth, H = window.innerHeight;
canvas.width = W;
canvas.height = H;

var theBall = {
    'radius': 20,
    'x': 0,
    'y': 0,
    'yGravity': 0.001,
    'lambdaT': 22,
    'vX': 0,
    'vY': 0,
    'fvX': 0,
    'fvY': 0,
    'whiteFlameMode': false
};
var flames = [];

var storyboard = {
    'init': function () {
        this.storyElem = $('#storyBindElem');
        var storyFuncList = [
            animation._ballGravityMove,
            bgm.play,

            //animation.skillTitle,
            //animation.skills_basic,

            animation.page2,
            animation.page2_browser,
            animation.page2_headphone,
            animation.page2_about,
            animation.backgroundChange,
            animation.skillTitle,
            animation.skills_basic,
            animation.starClassAni,
            //animation.skills_projects,
            //animation.skills_other
            animation.toBeContinue
        ];
        var i = 0;
        this.storyElem.bind('nextStory', function () {
            //alert(i++);
            //match(/function (\S+)\s?\(/)
            storyFuncList[i++]();
        });
    },
    'next': function () {
        this.storyElem.trigger('nextStory');
    }
};
var animation = {
    'start': function () {
        storyboard.init();
        this._theBallInit();
        bgm.init();

        $('#startButton').removeClass('default');   //avoid was clicked again
        $('#startRound').addClass('startButtonAnimation').fadeOut(function () { //change the round
            $('#page1').hide();
            storyboard.next();
        });
    },
    '_theBallInit': function () {
        theBall.x = window.innerWidth / 2;
        theBall.y = window.innerHeight / 2;
        this.ballDraw(theBall, 'white');

        this.ballPath = ballPath;
        this.bpIndex = 0;
        this.pathUpdateTime = 500;   //unit is ms
        this.pathMoveTime = this.pathUpdateTime / 16.7;
    },
    'stopFlag': false,
    '_ballGravityMove': function () {
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
            storyboard.next();
        }
    },
    'ballDraw': function (b, fillStyle) {
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    },
    'ballPathUpdate': function () {
        //var time = (+new Date) - startTime;
        var path = this.ballPath;
        var times = this.pathMoveTime;

        if (this.bpIndex < path.length - 1) {
            var distCoord = path[this.bpIndex++];
            theBall.vX = (distCoord.x - theBall.x) / times;
            theBall.vY = (distCoord.y - theBall.y) / times;
            if (distCoord.fvX) {
                theBall.fvX = distCoord.fvX;
                theBall.fvY = distCoord.fvY;
            }
        } else {
            theBall.vX = theBall.vY = 0;
            theBall.fvX = theBall.fvY = 0;
            clearInterval(animation.bIntervalId);
        }
    },
    'colorfulFlame': function () {
        var volumn = bgm.getBassVolumn() / 255;
        //Lets create some flames now
        var coefficient = Math.pow(volumn, 2.2);  //系数 0~1
        var particle_count = coefficient * 80 | 0;
        for (var i = 0; i < particle_count; i++) {
            flames.push(new Flame());
        }
        theBall.radius = (20 + volumn * 30) | 0;
        animation.framesDraw();
        requestAnimationFrame(animation.colorfulFlame);
    },
    'framesDraw': function () {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < flames.length; i++) {
            var p = flames[i];
            ctx.beginPath();
            //changing opacity according to the life.
            //opacity goes to 0 at the end of life of a Flame
            var opacity = ((p.remaining_life / p.life * 100) | 0) / 100;
            //a gradient instead of white fill
            var lx = p.location.x | 0,
                ly = p.location.y | 0;
            if (theBall.whiteFlameMode) {
                ctx.fillStyle = "rgba(255, 255, 255, " + (opacity / 2) + ")";
            } else {
                var gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, p.radius);
                gradient.addColorStop(0, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + opacity + ")");
                gradient.addColorStop(0.5, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + opacity + ")");
                //gradient.addColorStop(1, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = gradient;
            }
            ctx.arc(lx, ly, p.radius, 0, Math.PI * 2);
            ctx.fill();

            //lets move the flames
            p.remaining_life--;
            p.radius -= 0.6;
            p.location.x += p.speed.x;
            p.location.y += p.speed.y;

            //regenerate flames
            if (p.remaining_life < 0 || p.radius < 0) {
                //a brand new Flame replacing the dead one
                flames.splice(i, 1);
                i--;
            }
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.arc(theBall.x, theBall.y, theBall.radius, 0, Math.PI * 2);
        ctx.fill();

        theBall.x += theBall.vX;
        theBall.y += theBall.vY;
    },
    'page2': function () {
        $('#page2').show();
        storyboard.next();
    },
    'page2_headphone': function () {
        $('#headphone').fadeIn('slow', function () {
            setTimeout(function () {
                $('#headphone').fadeOut('slow', function () {
                    storyboard.next();
                });
            }, 2000);
        });
    },
    'page2_browser': function () {
        $('#browser').fadeIn('slow', function () {
            setTimeout(function () {
                $('#browser').fadeOut('slow', function () {
                    storyboard.next();
                });
            }, 2000);
        });
    },
    'page2_about': function () {
        //if ballPath was exists.
        if (ballPath.length > 0) {
            animation.bIntervalId = setInterval(function () {
                animation.ballPathUpdate();
            }, animation.pathUpdateTime);
        }
        var abouts = $('#about').show().find('span');
        setTimeout(function () {
            //abouts[0].style.visibility = 'visible';
            abouts.eq(0).show().addClass('blurInAni');
            abouts.eq(1).show().addClass('blurInAni');
        }, 1200);
        setTimeout(function () {
            abouts.eq(2).show().addClass('blurInAni');
            abouts.eq(3).show().addClass('blurInAni');
        }, 4200);
        setTimeout(function () {
            abouts.eq(4).show().addClass('blurInAni');
            abouts.eq(5).show().addClass('blurInAni');
        }, 5700);
        setTimeout(function () {
            abouts.eq(6).show().addClass('blurInAni');
        }, 9000);
        setTimeout(function () {
            abouts.eq(7).show().addClass('blurInAni');
        }, 12000);
        setTimeout(function () {
            $('#about').css('top', H);
            $('#background').css('top', '0');
            storyboard.next();
        }, 16000);
    },
    'backgroundChange': function () {
        setTimeout(function () {
            ctx.globalCompositeOperation = 'source-over';
            theBall.whiteFlameMode = true;
            storyboard.next();
        }, 600);
    },
    'skillTitle': function () {
        $('#page3').show();
        $('#skillTitle').show(function () {
            $('#skillTitle').css('left', '50%')
        });
        setTimeout(function () {
            $('#skillTitle').css('left', '-100%');
        }, 5500);
        setTimeout(function () {
            storyboard.next();
        }, 7500);
    },
    'skills_basic': function () {
        $('#skills').show(function () {
            $('#skills').css('left', '-50%')
        });
        setTimeout(function () {
            animation.starAni('#codeStar', 3);
        }, 1400);
        setTimeout(function () {
            $('.star').show(function () {
                $('#codeStar').text('☆☆☆☆☆');
            });
            animation.starAni('#psStar', 2);
        }, 1760);
        setTimeout(function () {
            animation.starAni('#imageStar', 30);
        }, 2000);
        setTimeout(function () {
            storyboard.next();
        }, 5000);
    },
    'starAni': function (starsElemSelect, time) {
        var i = 0, timeout;
        timeout = time <= 5 ? 120 : 30;
        var id = setInterval(function () {
            if (i++ < time) {
                var str = '';
                if (time <= 5) {
                    str = '★★★★★'.substr(0,i) + '☆☆☆☆☆'.substr(i, 5);
                } else {
                    for (var j = 0; j <= i; j++) {
                        str += '★';
                    }
                }
                console.log(timeout);
                $(starsElemSelect).text(str);
            } else {
                clearInterval(id);
            }
        }, timeout);
    },
    'starClassAni': function () {
        //TODO
        setTimeout(function () {
            storyboard.next();
        }, 5000);
    },
    'toBeContinue': function () {
        $('#background').css('top', '100%');
        ctx.globalCompositeOperation = "source-over";
        ctx.globalCompositeOperation = "lighter";
        theBall.whiteFlameMode = false;
    }
};

var audioCtx, audio, source, analyser, length, output;
var startTime;
var bgm = {
    init: function () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        try {
            audioCtx = new window.AudioContext();
        } catch (e) {
            alert('Your browser does not support AudioContext!');
        }
        audio = document.getElementById('bgm');
        source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        //link：source → analyser → destination
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        //计算出采样频率44100所需的缓冲区长度
        length = analyser.frequencyBinCount * 44100 / audioCtx.sampleRate | 0;
        //创建数据
        output = new Uint8Array(length);
    },
    getBassVolumn: function () {
        analyser.getByteFrequencyData(output);
        var volumn = 0;
        for (var i = 0; i < 512; i++) {
            volumn += output[i];
        }
        volumn /= 512;
        return volumn;
    },
    //getHighPitchVolumn: function () {
    //    analyser.getByteFrequencyData(output);
    //    var volumn = 0;
    //    for (var i = 128; i < 256; i++) {
    //        volumn += output[i];
    //    }
    //    volumn /= 128;
    //    return volumn;
    //},
    play: function () {
        setTimeout(function () {
            audio.play();
            startTime = (+new Date);
            ctx.globalCompositeOperation = "source-over";
            ctx.globalCompositeOperation = "lighter";
            animation.colorfulFlame();
            storyboard.next();
        }, 500);
    }
};

function Flame() {
    //speed, life, location, life, colors
    //speed.x range = -2.5 to 2.5
    //speed.y range = -15 to -5 to make it move upwards
    //lets change the Y speed to make it look like a flame
    this.speed = {
        x: -2 + Math.random() * 4 + theBall.fvX,
        y: -2 + Math.random() * 4 + theBall.fvY
    };
    var r = theBall.radius / 1.5;
    this.location = {
        x: (theBall.x - r + 2 * Math.random() * r) | 0,
        y: (theBall.y - r + 2 * Math.random() * r) | 0
    };
    //radius range = 10-30
    this.radius = (14 + Math.random() * 16) | 0;
    //life range = 20-30
    this.life = 40;
    this.remaining_life = this.life;
    //colors
    this.r = (Math.random() * 255) | 0;
    this.g = (Math.random() * 255) | 0;
    this.b = (Math.random() * 255) | 0;
}
