const degreeRad = Math.PI / 180;
let trigger = false;
const area = document.getElementById("trigger-area");

area.addEventListener("keydown", (e) => {
  if (e.key == "s") {
    trigger = true;
  }
})

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
  const center_x = 300;
  const center_y = 300;

  let positions = [];

  for (let i = 0; i < precision; i++) {
    positions[i * 6] = center_x;
    positions[i * 6 + 1] = center_y;
    positions[i * 6 + 2] = center_x + radius * Math.cos(angleRad + (offsetAngleRad * i / precision));
    positions[i * 6 + 3] = center_y + radius * Math.sin(angleRad + (offsetAngleRad * i / precision));
    positions[i * 6 + 4] = center_x + radius * Math.cos(angleRad + (offsetAngleRad * (i + 1) / precision));
    positions[i * 6 + 5] = center_y + radius * Math.sin(angleRad + (offsetAngleRad * (i + 1) / precision));
  }
  return positions;

}

function circle(sides, r) {
  const center_x = 300;
  const center_y = 300;

  let positions = [];

  for (let i = 0; i < sides; i++) {
    positions[i * 6] = center_x;
    positions[i * 6 + 1] = center_y;
    positions[i * 6 + 2] = center_x + (r * Math.cos(Math.PI * 2 * i / sides));
    positions[i * 6 + 3] = center_y + (r * Math.sin(Math.PI * 2 * i / sides));
    positions[i * 6 + 4] = center_x + (r * Math.cos(Math.PI * 2 * (i + 1) / sides));
    positions[i * 6 + 5] = center_y + (r * Math.sin(Math.PI * 2 * (i + 1) / sides));
  }

  return positions;
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

  void main() {
    
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace, 1.0, 1.0);

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

  gl.useProgram(program);

  const skillcheck_radius = 78;
  const skillcheck_width = 4;
  let startingAngle = degreeRad * (Math.round(Math.random() * 190) + 80);
  const maxOffset = 50 * degreeRad;
  const greatOffset = 15 * degreeRad;
  const fifty = Math.round(Math.random());

  const greatPrecision = 50;
  const normalPrecision = 50;
  const circlePrecision = 50;

  var primitiveType = gl.TRIANGLES;
  var offset = 0;

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  const alertCirclePositions = circle(circlePrecision, skillcheck_radius - skillcheck_width - 2);
  const outlineCirclePositions = circle(circlePrecision, skillcheck_radius - skillcheck_width);
  const maskCirclePositions = circle(circlePrecision, skillcheck_radius - 2 * skillcheck_width);


  // buffer for gray circle
  const alertCircleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, alertCircleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alertCirclePositions), gl.STATIC_DRAW);

  // alert circle VAO
  const alertCircleVAO = gl.createVertexArray();
  gl.bindVertexArray(alertCircleVAO);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, 0, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindVertexArray(null);

  // buffer for white outline circle 
  const outlineCircleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, outlineCircleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outlineCirclePositions), gl.STATIC_DRAW);

  // white outline circle VAO
  const outlineCircleVAO = gl.createVertexArray();
  gl.bindVertexArray(outlineCircleVAO);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, 0, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindVertexArray(null);

  // buffer for masking circle
  const maskingCircleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, maskingCircleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(maskCirclePositions), gl.STATIC_DRAW);

  // masking circle VAO
  const maskingCircleVAO = gl.createVertexArray();
  gl.bindVertexArray(maskingCircleVAO);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, 0, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindVertexArray(null);

  // buffer for sector
  let sectorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sectorBuffer);
  // sc VAO
  const sectorVAO = gl.createVertexArray();
  gl.bindVertexArray(sectorVAO);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, 0, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindVertexArray(null);


  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  const colorUniformLocation = gl.getUniformLocation(program, "u_color");

  const increment = 1500;
  let inctime = increment;


  const frame = function(dt) {

    if (dt - inctime > increment) {
      startingAngle = degreeRad * (Math.round(Math.random() * 190) + 80);
      inctime += increment;
    }


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(resolutionUniformLocation, 600, 600);
    gl.uniform4f(colorUniformLocation, 1, 1, 1, 1);

    gl.bindVertexArray(outlineCircleVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, outlineCircleBuffer);
    gl.drawArrays(primitiveType, offset, circlePrecision * 3);
    gl.bindVertexArray(null);

    gl.uniform4f(colorUniformLocation, 0.1, 0.1, 0.1, 1);
    gl.bindVertexArray(alertCircleVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, alertCircleBuffer);
    gl.drawArrays(primitiveType, offset, circlePrecision * 3);
    gl.bindVertexArray(null);


    let greatPositions;
    if (fifty === 1) {
      greatPositions = draw_sector(skillcheck_radius, greatOffset, startingAngle - greatOffset, greatPrecision)
    } else {
      greatPositions = draw_sector(skillcheck_radius, greatOffset, startingAngle + maxOffset, greatPrecision)
    }

    gl.uniform4f(colorUniformLocation, 1, 1, 1, 1);
    gl.bindVertexArray(sectorVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, sectorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(greatPositions), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, greatPrecision * 3);
    gl.bindVertexArray(null);

    let normalPositions = draw_sector(skillcheck_radius, maxOffset, startingAngle, normalPrecision);
    gl.uniform4f(colorUniformLocation, 0.2, 0.2, 0.2, 1);
    gl.bindVertexArray(sectorVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, sectorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalPositions), gl.STATIC_DRAW);
    gl.drawArrays(primitiveType, offset, normalPrecision * 3);
    gl.bindVertexArray(null);


    gl.uniform4f(colorUniformLocation, 0.1, 0.1, 0.1, 1);
    gl.bindVertexArray(maskingCircleVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, maskingCircleBuffer);
    gl.drawArrays(primitiveType, offset, circlePrecision * 3); // * 3 cause a triangle has 3 vertexes
    gl.bindVertexArray(null);
    requestAnimationFrame(frame);

    if (dt - inctime < 1000) {
      let triggerPositions = draw_sector(skillcheck_radius + 2, 5 * degreeRad, -1 * ((dt - inctime) % 1000) / (1000 / 360) * degreeRad + 90 * degreeRad, 1);
      gl.uniform4f(colorUniformLocation, 1, 0, 0, 1);
      gl.bindVertexArray(sectorVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, sectorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triggerPositions), gl.STATIC_DRAW);
      gl.drawArrays(primitiveType, offset, 3);
      gl.bindVertexArray(null);
    }
    if (trigger) {
      console.log(((dt - inctime) % 1000) / (1000 / 360));
      trigger = false;
    }
  }
  requestAnimationFrame(frame);
}

draw_sectors()

