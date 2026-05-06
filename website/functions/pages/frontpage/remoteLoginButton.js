document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('remoteLoginButton');

    button.addEventListener('click', () => {
        window.location.href = '/remote-login';
    });
});