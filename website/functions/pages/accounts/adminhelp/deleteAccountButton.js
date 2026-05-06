document.addEventListener('DOMContentLoaded', async function () {
	const btn = document.getElementById('deleteAccountBtn');
    const accountDisplay = document.getElementById('adminOutputDisplay');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const csrfRes = await fetch('/api/csrf-token');
    const { csrfToken } = await csrfRes.json();

	if (!btn) return;

	btn.addEventListener('click', function (e) {
		e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            accountDisplay.textContent = 'Username or password rejected.';
            return;
        }

        usernameInput.value = '';
        passwordInput.value = '';
        
        fetch('/api/accounts/admin-bypass', {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        }).then(response => {
            if (response.ok) {
                accountDisplay.textContent = `Account with username "${username}" deleted successfully.`;
            } else {
                accountDisplay.textContent = 'Error deleting account.';
            }
        }).catch(error => {
            accountDisplay.textContent = 'Error deleting account.';
        });
	});
});