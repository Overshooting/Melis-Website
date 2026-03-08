const form = document.getElementById("artForm");
const fileInput = document.getElementById("imageInput");
const artistNameInput = document.getElementById("artistName");
const artTitleInput = document.getElementById("artTitle");
const statusMessage = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    const artistName = artistNameInput.value.trim();
    const artTitle = artTitleInput.value.trim();

    const validationError = validateSubmission(file, artistName, artTitle);

    if (validationError) {
        statusMessage.textContent = validationError;
        return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("artistName", artistName);
    formData.append("artTitle", artTitle);

    try {
        const response = await fetch("/api/submitArt/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        statusMessage.textContent = "Uploading submission...";

        if (!response.ok) {
            throw new Error(result.message || "Upload failed");
        }

        statusMessage.textContent = "Upload successful! Pending review.";
        form.reset();

    } catch (err) {
        statusMessage.textContent = err.message;
    }
});