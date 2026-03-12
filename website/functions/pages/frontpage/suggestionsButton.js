document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('suggestionsButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/suggestions';
	});
});