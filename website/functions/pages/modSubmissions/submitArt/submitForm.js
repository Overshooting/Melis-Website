const form = document.getElementById("artForm");
const fileInput = document.getElementById("imageInput");
const artistNameInput = document.getElementById("artistName");
const artTitleInput = document.getElementById("artTitle");
const statusMessage = document.getElementById("message");
const imagePreview = document.getElementById("imagePreview");
const submitButton = document.getElementById("submitButton");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;

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
        submitButton.disabled = false;
    } catch (err) {
        statusMessage.textContent = err.message;
        submitButton.disabled = false;
    }
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        imagePreview.src = reader.result;
        imagePreview.style.display = "block";
    });

    reader.readAsDataURL(file);
});

function validateSubmission(file, artistName, artTitle) {

    if (!file) {
        return "Please select an image.";
    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Invalid file type. Only PNG, JPG, and WEBP allowed.";
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        return "Image must be smaller than 5MB.";
    }

    if (artTitle.length < 3) {
        return "Title must be at least 3 characters.";
    }

    if (artTitle.length > 50) {
        return "Title too long.";
    }

    if (!artistName) {
        artistName = "Anonymous";
    }

    if (artistName.length > 30) {
        return "Artist name too long.";
    }

    return null;
}