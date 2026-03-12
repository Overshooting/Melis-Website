document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('williamWebsiteButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/williamwebsite';
	});
});