const degreeRad = Math.PI / 180;

function showError(error) {
  const errorSpace = document.getElementById("errorp");
  errorSpace.innerText = error;
  console.warn(error);
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  showError(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  showError(gl.getProgramInfoLog(program));
  gl.deleteProgram(program)
}

// Draw a sector from origin.
function draw_sector(radius, offsetAngleRad, angleRad, precision) {
  let positions = [];
  for (let triangleID = 0; triangleID < precision; triangleID++) {
    positions[triangleID] = [
      0, 0, // origin
      radius * Math.sin(angleRad + (offsetAngleRad * triangleID / precision)),
      radius * Math.cos(angleRad + (offsetAngleRad * triangleID / precision)), // triangle vertex angleRad
      radius * Math.sin(angleRad + (offsetAngleRad * (triangleID + 1) / precision)),
      radius * Math.cos(angleRad + (offsetAngleRad * (triangleID + 1) / precision)), // vertex angleRad + offsetAngleRad
    ];
  }
  return positions;
}

function circle(gl, sides, r) {
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 3;

  for (let i = 0; i < sides; i++) {

    var positions = [0, 0,
      (r * Math.sin(Math.PI * 2 * i / sides)), (r * Math.cos(Math.PI * 2 * i / sides)),
      (r * Math.sin(Math.PI * 2 * (i + 1) / sides)), (r * Math.cos(Math.PI * 2 * (i + 1) / sides))]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, count);
  }
}

function draw_sectors() {
  const canvas = document.getElementById("drawing-box");
  if (!canvas) {
    showError("Can't get canvas by ID!");
    return;
  }

  const gl = canvas.getContext("webgl2");
  if (!canvas) {
    showError("Shit browser detected");
    return;
  }
  var vertexShaderSource = `#version 300 es
     
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;
     
    // all shaders have a main function
    void main() {
     
      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }
    `;

  var fragmentShaderSource = `#version 300 es
     
    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;
     
    // we need to declare an output for the fragment shader
    out vec4 outColor;
     
    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(0.1, 0.1, 0.1, 1);
    }
    `;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  var program = createProgram(gl, vertexShader, fragmentShader);

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var postionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, postionBuffer);

  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  var size = 2;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.bindVertexArray(vao);

  let positions = draw_sector(0.5, degreeRad * 15, degreeRad * (Math.round(Math.random() * 190) + 80), 20);
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 3;
  for (let index = 0; index < positions.length; index++) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions[index]), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, count);
  }

  circle(gl, 50, 0.45);

  showError("good");


}

draw_sectors()
