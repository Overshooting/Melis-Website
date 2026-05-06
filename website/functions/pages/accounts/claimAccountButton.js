document.addEventListener('DOMContentLoaded', async function () {
	const btn = document.getElementById('claimAccountBtn');
    const accountDisplay = document.getElementById('outputDisplay');
    const usernameInput = document.getElementById('claimUsernameInput');
    const nameInput = document.getElementById('claimNameInput');
    const passwordInput = document.getElementById('claimPasswordInput');
    const csrfRes = await fetch('/api/csrf-token');
    const { csrfToken } = await csrfRes.json();

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

        usernameInput.value = '';
        nameInput.value = '';
        passwordInput.value = '';

        fetch('/api/accounts/claim', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({ username: username, personName: name, password: password }),
        })
        .then(response => {
            if (response.status == 409) {
                accountDisplay.textContent = 'Account is already claimed or does not exist.';
            } else if (response.ok) {
                window.location.reload();
            } else {
                accountDisplay.textContent = 'Error claiming account.';
            }
        }).catch(error => {
            accountDisplay.textContent = 'Error claiming account.';
        
        });
	});
});