document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('randomNumberGeneratorButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/random-number-generator';
	});
});