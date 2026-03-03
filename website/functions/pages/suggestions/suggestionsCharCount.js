document.addEventListener('DOMContentLoaded', function () {
    const suggestionInput = document.getElementById('suggestionInput');
    const nameInput = document.getElementById('nameInput');
    const suggestionCharacterCount = document.getElementById('suggestionCharacterCount');
    const nameCharacterCount = document.getElementById('nameCharacterCount');

    checkCharCount(suggestionInput, suggestionCharacterCount, 100);
    checkCharCount(nameInput, nameCharacterCount, 50);

    suggestionInput.addEventListener('input', function () {
        checkCharCount(suggestionInput, suggestionCharacterCount, 100);
    });

    nameInput.addEventListener('input', function () {
        checkCharCount(nameInput, nameCharacterCount, 50);
    });
});

function checkCharCount(input, countDisplay, maxChars) {
    const currentLength = input.value.length;
    countDisplay.textContent = currentLength;

    if (currentLength >= maxChars) {
        countDisplay.style.color = 'red';
        input.value = input.value.substring(0, maxChars);
        countDisplay.textContent = maxChars;
    } else {
        countDisplay.style.color = '';
    }
};