const button = document.getElementById("pick-file-btn");

button.addEventListener("click", async () => {
  const extensionSelecter = document.getElementById("extension-selecter");
  const selectedExtension = extensionSelecter.value;
  const filePath = await window.api.pickFile(selectedExtension);
  if (filePath) {
    console.log("Selected file:", filePath);
  } else {
    console.log("No file selected");
  }
});
