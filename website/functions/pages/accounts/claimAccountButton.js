document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('claimAccountBtn');
    const accountDisplay = document.getElementById('outputDisplay');
    const usernameInput = document.getElementById('claimUsernameInput');
    const nameInput = document.getElementById('claimNameInput');
    const passwordInput = document.getElementById('claimPasswordInput');

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

        const username = usernameInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !name || !password) {
            accountDisplay.textContent = 'Parameters rejected.';
            return;
        }

        const csrfToken = await fetchCSRFToken();
        if (!csrfToken) {
            accountDisplay.textContent = 'Error: Failed to fetch CSRF token.';
            return;
        }

        usernameInput.value = '';
        nameInput.value = '';
        passwordInput.value = '';

        fetch('/api/accounts/claim', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, personName: name, password: password, csrfToken: csrfToken }),
        })
        .then(response => {
            if (response.status == 409) {
                accountDisplay.textContent = 'Account is already claimed or does not exist.';
            } else if (response.ok) {
                accountDisplay.textContent = `Account with username "${username}" claimed successfully by ${name}. Please refresh your page.`;
                window.location.reload();
            } else {
                accountDisplay.textContent = 'Error claiming account.';
            }
        }).catch(error => {
            accountDisplay.textContent = 'Error claiming account.';
        
        });
	});
});