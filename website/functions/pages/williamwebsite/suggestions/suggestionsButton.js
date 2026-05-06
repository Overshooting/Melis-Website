document.addEventListener('DOMContentLoaded', async function () {
	const btn = document.getElementById('submitSuggestionButton');
    const responseMessage = document.getElementById('responseMessage');
    const suggestionInput = document.getElementById('suggestionInput');
    const nameInput = document.getElementById('nameInput');
    const suggestionCharacterCount = document.getElementById('suggestionCharacterCount');
    const nameCharacterCount = document.getElementById('nameCharacterCount');
    const csrfRes = await fetch('/api/csrf-token');
    const { csrfToken } = await csrfRes.json();

	if (!btn) return;
	
    btn.addEventListener('click', async function (e) {
		e.preventDefault();

        const suggestion = suggestionInput.value.trim();
        const name = nameInput.value.trim() !== '' ? nameInput.value.trim() : 'Anonymous';

        if (!suggestion) {
            responseMessage.textContent = 'Parameters rejected.';
            return;
        }

        suggestionInput.value = '';
        nameInput.value = '';
        suggestionCharacterCount.textContent = '0';
        nameCharacterCount.textContent = '0';

        responseMessage.textContent = 'Submitting suggestion...';

        fetch('/williamwebsite/api/suggestions/submit', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({ suggestion: suggestion, name: name, }),
        })
        .then(response => {
            if (response.ok) {
                responseMessage.textContent = `Suggestion submitted successfully by ${name}`;
            } else {
                responseMessage.textContent = 'Error submitting suggestion.';
            }
        }).catch(error => {
            responseMessage.textContent = 'Error submitting suggestion.';
        
        });
	});
});