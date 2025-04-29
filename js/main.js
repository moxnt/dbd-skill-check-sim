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
  let startingPoint = [300, 300];
  let positions = [];
  for (let triangleID = 0; triangleID < precision; triangleID++) {
    positions[triangleID] = [
      startingPoint[0], startingPoint[1], // origin
      startingPoint[0] + radius * Math.sin(angleRad + (offsetAngleRad * triangleID / precision)),
      startingPoint[1] + radius * Math.cos(angleRad + (offsetAngleRad * triangleID / precision)), // triangle vertex angleRad
      startingPoint[0] + radius * Math.sin(angleRad + (offsetAngleRad * (triangleID + 1) / precision)),
      startingPoint[1] + radius * Math.cos(angleRad + (offsetAngleRad * (triangleID + 1) / precision)), // vertex angleRad + offsetAngleRad
    ];
  }
  return positions;
}

function circle(gl, sides, r) {
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 3;

  for (let i = 0; i < sides; i++) {

    var positions = [300, 300,
      300 + (r * Math.sin(Math.PI * 2 * i / sides)), 300 + (r * Math.cos(Math.PI * 2 * i / sides)),
      300 + (r * Math.sin(Math.PI * 2 * (i + 1) / sides)), 300 + (r * Math.cos(Math.PI * 2 * (i + 1) / sides))]
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

  in vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_rotation;

  void main() {
    
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    vec2 rotated_position = vec2(clipSpace.x * u_rotation.y + clipSpace.y * u_rotation.x, clipSpace.y * u_rotation.y + clipSpace.x * u_rotation.x);

    gl_Position = vec4(rotated_position.x, rotated_position.y, 1.0, 1.0);

  }`;

  var fragmentShaderSource = `#version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;
    
    uniform vec4 u_color;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

  void main() {
    outColor = u_color;
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

  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  gl.uniform2f(resolutionUniformLocation, 600, 600);

  var rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
  gl.uniform2f(rotationUniformLocation, 0.1, 1);

  var resolutionUniformLocation = gl.getUniformLocation(program, "u_color");

  gl.bindVertexArray(vao);

  const skillcheck_radius = 78;
  const skillcheck_width = 4;

  gl.uniform4f(resolutionUniformLocation, 1, 1, 1, 0.9);
  circle(gl, 50, skillcheck_radius - skillcheck_width);

  gl.uniform4f(resolutionUniformLocation, 0, 0, 0, 0.9);
  circle(gl, 50, skillcheck_radius - skillcheck_width - 1);

  const startingAngle = degreeRad * (Math.round(Math.random() * 190) + 80);
  const maxOffset = 50 * degreeRad;
  const greatOffset = 15 * degreeRad;
  const fifty = Math.round(Math.random());

  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 3;

  let positions = draw_sector(skillcheck_radius, maxOffset, startingAngle, 20);

  gl.uniform4f(resolutionUniformLocation, 1, 1, 1, 0.9);

  for (let index = 0; index < positions.length; index++) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions[index]), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, count);
  }

  if (fifty === 1) {
    positions = draw_sector(skillcheck_radius, maxOffset, startingAngle - greatOffset, 20);
  } else {
    positions = draw_sector(skillcheck_radius, maxOffset, startingAngle + greatOffset, 20);
  }

  gl.uniform4f(resolutionUniformLocation, 0.2, 0.2, 0.2, 0.9);

  for (let index = 0; index < positions.length; index++) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions[index]), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, count);
  }

  gl.uniform4f(resolutionUniformLocation, 0, 0, 0, 1);
  circle(gl, 50, skillcheck_radius - 2 * skillcheck_width);
}

draw_sectors()

