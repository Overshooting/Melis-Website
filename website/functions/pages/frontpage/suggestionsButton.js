document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('suggestionsButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/suggestions';
	});
});