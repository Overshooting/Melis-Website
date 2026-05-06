document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('addAccountBtn');
    const accountDisplay = document.getElementById('outputDisplay');
    const usernameInput = document.getElementById('addUsernameInput');
    const passwordInput = document.getElementById('addPasswordInput');

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
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            accountDisplay.textContent = 'Username or password rejected.';
            return;
        }

        const csrfToken = await fetchCSRFToken();
        if (!csrfToken) {
            accountDisplay.textContent = 'Error: Failed to fetch CSRF token.';
            return;
        }

        usernameInput.value = '';
        passwordInput.value = '';
        
        fetch('/api/accounts/add-empty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                csrfToken: csrfToken,
            }),
        }).then(response => {
            if (response.ok) {
                accountDisplay.textContent = `Account with username "${username}" added successfully. Please refresh your page.`;
                window.location.reload();
            } else {
                accountDisplay.textContent = 'Error adding account.';
            }
        }).catch(error => {
            accountDisplay.textContent = 'Error adding account.';
        });
	});
});