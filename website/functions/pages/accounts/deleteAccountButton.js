document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('deleteAccountBtn');
    const accountDisplay = document.getElementById('outputDisplay');
    const usernameInput = document.getElementById('deleteUsernameInput');
    const passwordInput = document.getElementById('deletePasswordInput');

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
        
        fetch('/api/accounts/data', {
            method: 'DELETE',
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
                accountDisplay.textContent = `Account with username "${username}" deleted successfully. Please refresh your page.`;
                window.location.reload();
            } else {
                accountDisplay.textContent = 'Error deleting account.';
            }
        }).catch(error => {
            accountDisplay.textContent = 'Error deleting account.';
        });
	});
});