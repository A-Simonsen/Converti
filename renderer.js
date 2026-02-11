const button = document.getElementById("pick-file-btn");

button.addEventListener("click", async () => {
  const filePath = await window.api.pickFile();
  if (filePath) {
    console.log("Selected file:", filePath);
  } else {
    console.log("No file selected");
  }
});
