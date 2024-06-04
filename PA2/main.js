'use strict';

let gl;                         // The webgl context.
let surface, surfaceP, surfaceB;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let pCoord = [0., 0.]
let gui;
let cam;
let vid;
let tex,
    texture;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function parametersChanged() {
    surface.BufferData(...CreateSurfaceData());
    centerOfMass[0] /= surface.count
    centerOfMass[1] /= surface.count
    centerOfMass[2] /= surface.count
    draw()
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    // gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection, m4.translation(-centerOfMass[0], -centerOfMass[1], -centerOfMass[2])));

    /* Draw the six faces of a cube, with different colors. */
    let hexToRgb = (hex) => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255.0,
            g: parseInt(result[2], 16) / 255.0,
            b: parseInt(result[3], 16) / 255.0
        } : null;
    }
    let c = hexToRgb(document.getElementById('pColor').value)
    gl.uniform4fv(shProgram.iColor, [c.r, c.g, c.b, 1]);
    gl.uniform1f(shProgram.iScaleBy, document.getElementById('scale').value);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.identity());
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        vid
    );
    surfaceB.Draw();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    cam.ApplyLeftFrustum();
    gl.colorMask(true, false, false, false);
    modelViewProjection = m4.multiply(cam.ProjectionMatrix, m4.multiply(cam.ModelViewMatrix, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    surface.Draw();
    cam.ApplyRightFrustum();
    gl.colorMask(false, true, true, false);
    modelViewProjection = m4.multiply(cam.ProjectionMatrix, m4.multiply(cam.ModelViewMatrix, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    surface.Draw();
    gl.colorMask(true, true, true, true);
    // gl.uniform1f(shProgram.iScaleBy, -1);
    // gl.uniform2fv(shProgram.iTranslateBy, pCoord);
    // gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false,
    //     m4.multiply(modelViewProjection, m4.translation(...WallisConicalEdge(
    //         mapRange(pCoord[0], 0, 1, 0, 2 * Math.PI),
    //         mapRange(pCoord[1], 0, 1, 0, infinity)
    //     ))));
    // surfaceP.Draw();
}
function dontstopVid() {
    draw()
    window.requestAnimationFrame(dontstopVid)
}
let infinity = 1;
let numOfSteps = 10;
function CreateSurfaceData() {
    a = parseFloat(document.getElementById('a').value);
    b = parseFloat(document.getElementById('b').value);
    c = parseFloat(document.getElementById('c').value);
    m = parseFloat(document.getElementById('m').value)
    centerOfMass = [0, 0, 0]
    let vertexList = [],
        textureList = [],
        u = 0,
        v = 0;
    infinity = parseFloat(document.getElementById('infinity').value)
    numOfSteps = parseInt(document.getElementById('numOfSteps').value)
    let V_STEP = infinity / numOfSteps
    while (u < 2 * Math.PI) {
        while (v < infinity) {
            let vertexA = WallisConicalEdge(u, v)
            let vertexB = WallisConicalEdge(u + 0.1, v)
            let vertexC = WallisConicalEdge(u, v + V_STEP)
            let vertexD = WallisConicalEdge(u + 0.1, v + V_STEP)
            vertexList.push(...vertexA)
            vertexList.push(...vertexB)
            vertexList.push(...vertexC)
            vertexList.push(...vertexC)
            vertexList.push(...vertexB)
            vertexList.push(...vertexD)
            textureList.push(mapRange(u, 0, 2 * Math.PI, 0, 1), mapRange(v, 0, infinity, 0, 1))
            textureList.push(mapRange(u + 0.1, 0, 2 * Math.PI, 0, 1), mapRange(v, 0, infinity, 0, 1))
            textureList.push(mapRange(u, 0, 2 * Math.PI, 0, 1), mapRange(v + V_STEP, 0, infinity, 0, 1))
            textureList.push(mapRange(u, 0, 2 * Math.PI, 0, 1), mapRange(v + V_STEP, 0, infinity, 0, 1))
            textureList.push(mapRange(u + 0.1, 0, 2 * Math.PI, 0, 1), mapRange(v, 0, infinity, 0, 1))
            textureList.push(mapRange(u + 0.1, 0, 2 * Math.PI, 0, 1), mapRange(v + V_STEP, 0, infinity, 0, 1))
            v += V_STEP;
        }
        v = 0
        u += 0.1
    }
    return [vertexList, textureList];

}

function mapRange(value, a, b, c, d) {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}

let a = 1, b = 0, c = 1, m = 0.5
let centerOfMass = [0, 0, 0]
function WallisConicalEdge(u, v) {
    const x = v * Math.cos(u),
        y = v * Math.sin(u),
        z = c * Math.sqrt(a * a - b * b * Math.pow(Math.cos(u), 2));
    centerOfMass[0] += x * m
    centerOfMass[1] += y * m
    centerOfMass[2] += z * m
    return [x * m, y * m, z * m];
}

function planeVertices() {
    const vertices = [
        [-1, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
        [-1, 1, 0]
    ]
    const indices = [0, 1, 2, 1, 0, 3]
    let vertexList = []
    indices.forEach(i => {
        vertexList.push(...vertices[i])
    })
    return vertexList;
}
function planeTextures() {
    const textures = [
        [1, 1],
        [0, 0],
        [0, 1],
        [1, 0]]
    const indices = [0, 1, 2, 1, 0, 3]
    let textureList = []
    indices.forEach(i => {
        textureList.push(...textures[i])
    })
    return textureList;
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    cam = new StereoCamera(10, 1, 1, 25, 8, 25)
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iScaleBy = gl.getUniformLocation(prog, "scaleBy");
    shProgram.iTranslateBy = gl.getUniformLocation(prog, "translateBy");

    surface = new Model('Surface');
    surfaceP = new Model('Surface');
    surface.BufferData(...CreateSurfaceData());
    surfaceP.BufferData(CreateSphereData(), CreateSphereData());
    centerOfMass[0] /= surface.count
    centerOfMass[1] /= surface.count
    centerOfMass[2] /= surface.count

    surfaceB = new Model('Surface');
    surfaceB.BufferData(planeVertices(), planeTextures());


    gl.enable(gl.DEPTH_TEST);
}

function CreateSphereData() {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v);
            let v2 = getSphereVertex(u + 0.1, v);
            let v3 = getSphereVertex(u, v + 0.1);
            let v4 = getSphereVertex(u + 0.1, v + 0.1);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += 0.1;
        }
        v = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.1;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function Vid() {
    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
        video.srcObject = stream;
        track = stream.getTracks()[0]; // this line is optional, but needs global variable track if not deleted
    }, function (e) {
        console.error('Rejected!', e);
    });
    return video;
}

/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    gui = new GUI();
    vid = Vid()
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    gui.add(cam, 'Convergence', 0, 20).onChange(draw);
    gui.add(cam, 'EyeSeparation', 0, 2).onChange(draw);
    gui.add(cam, 'FOV', 0, 3.14).onChange(draw);
    gui.add(cam, 'NearClippingDistance', 8, 12).onChange(draw);

    spaceball = new TrackballRotator(canvas, draw, 0);
    tex = CreateTexture()
    LoadTexture()
    draw();
    dontstopVid()
}

function LoadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/oleksandr-yakov/VG2I-lab1/CGW/gif/butterfly-icon.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}
function CreateTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture
}