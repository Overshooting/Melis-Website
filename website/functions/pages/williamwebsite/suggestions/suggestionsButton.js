document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('submitSuggestionButton');
    const responseMessage = document.getElementById('responseMessage');
    const suggestionInput = document.getElementById('suggestionInput');
    const nameInput = document.getElementById('nameInput');
    const suggestionCharacterCount = document.getElementById('suggestionCharacterCount');
    const nameCharacterCount = document.getElementById('nameCharacterCount');

    async function fetchCSRFToken() {
        try {
            const response = await fetch('/api/csrf-token');
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            return null;
        }
    }

	if (!btn) return;
	
    btn.addEventListener('click', async function (e) {
		e.preventDefault();

        const suggestion = suggestionInput.value.trim();
        const name = nameInput.value.trim() !== '' ? nameInput.value.trim() : 'Anonymous';

        if (!suggestion) {
            responseMessage.textContent = 'Parameters rejected.';
            return;
        }

        const csrfToken = await fetchCSRFToken();
        if (!csrfToken) {
            responseMessage.textContent = 'Error: Failed to fetch CSRF token.';
            return;
        }

        suggestionInput.value = '';
        nameInput.value = '';
        suggestionCharacterCount.textContent = '0';
        nameCharacterCount.textContent = '0';

        responseMessage.textContent = 'Submitting suggestion...';

        fetch('/williamwebsite/api/suggestions/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ suggestion: suggestion, name: name, csrfToken: csrfToken }),
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