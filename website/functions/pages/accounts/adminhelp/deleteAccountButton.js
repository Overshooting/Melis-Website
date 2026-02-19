document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('deleteAccountBtn');
    const accountDisplay = document.getElementById('adminOutputDisplay');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');

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
            headers: {
                'Content-Type': 'application/json',
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