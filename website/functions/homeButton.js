document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('homeBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/';
	});
});
