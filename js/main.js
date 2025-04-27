function showError(error) {
  const errorSpace = document.getElementById("errorp");
  errorSpace.innerText = error;
  console.warn(error);
}

function hello_webgl() {
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

  showError("good");


}

hello_webgl()
