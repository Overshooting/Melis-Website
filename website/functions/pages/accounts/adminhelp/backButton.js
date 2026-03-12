document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('backBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/accounts';
	});
});