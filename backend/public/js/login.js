const params = new URLSearchParams(window.location.search);

const returnToInput = document.getElementById("return_to");

if (returnToInput) {
  returnToInput.value = params.get("return_to") || "/";
}
