
var gl;
function initGL(canvas) {
    try {
	gl = canvas.getContext("experimental-webgl");
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	console.log("WebGL initialized");
    } catch (e) {
    }
    if (!gl) {
	alert("Could not initialise WebGL");
    }
}

function initPlayer() {
    var player = {
    };
}


var playerImage;
function initTexture() {
    playerImage = gl.createTexture();
    playerImage.image = new Image();
    playerImage.image.onload = function() {
	handleLoadedTexture(playerImage);
    }
    playerImage.image.src = "assets/snapchat.png";
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
	return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
	if (k.nodeType == 3) {
	    str += k.textContent;
	}
	k = k.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
	shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
	shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
	alert("could not find shader: ", id);
	return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	alert(gl.getShaderInfoLog(shader));
	return null;
    }

    return shader;
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Could not initialize shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    console.log("Vertex attribute: ", shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    console.log("texture attribute: ", shaderProgram.textureCoordAttribute);
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var squareVertexPositionBuffer;

function initBuffers() {

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    var vertices = [
	1.0,  1.0, 0.0,
	    -1.0,  1.0, 0.0,
	1.0, -1.0, 0.0,
	    -1.0, -1.0, 0.0
    ];


    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.map( function(x) {
	return x * 0.5;
    })),
		  gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    var textureCoords = [
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    textureBuffer.itemSize = 2;
    textureBuffer.numItems = 4;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
}

var squareMVMatrix = mat4.create();

mat4.identity(squareMVMatrix);

mat4.translate(squareMVMatrix, [0.0, 0.0, -7.0]);
mat4.translate(squareMVMatrix, [0.0, 0.0, 0.0]);

var i = 1.0;
var posX = 0.0;
var posY = 0.0;
var posZ = 0.0;
var movSpeed = 0.1;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    movement();

    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, playerImage);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [-3.0, 0.0, -7.0]);

    mat4.set(squareMVMatrix, mvMatrix);

    mat4.translate(mvMatrix, [posX, posY, posZ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

    window.requestAnimationFrame(drawScene);
}

function webGLStart() {
    var canvas = document.getElementById("webcanvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
}

window.addEventListener("load", function() {
    var canvas = document.getElementById("webcanvas");
    canvas.width = window.innerWidth;
    
    webGLStart();
});

window.addEventListener("resize", function() {
    var canvas = document.getElementById("webcanvas");
    canvas.width = window.innerWidth;
});


var keysDown = [];

window.addEventListener("keydown", function(e) {
    var index = keysDown.indexOf(e.keyCode); 
    if (index == -1) {
	keysDown.push(e.keyCode);
    }
});

window.addEventListener("keyup", function(e) {
    var index = keysDown.indexOf(e.keyCode); 
    if (index != -1) {
	if (index == keysDown.length - 1) {
	    keysDown.pop();
	} else {
	    keysDown[index] = keysDown[keysDown.length - 1];
	    keysDown.pop();
	}
    }
});


function movement() {
    var j = 0;
    for ( ; j < keysDown.length; j++) {
	if (keysDown[j] == 65) {
	    posX = posX - movSpeed;
	} else if (keysDown[j] == 87) {
	    posY = posY + movSpeed;
	} else if (keysDown[j] == 68) {
	    posX = posX + movSpeed;
	} else if (keysDown[j] == 83) {
	    posY = posY - movSpeed;
	}    
    }
    
}
