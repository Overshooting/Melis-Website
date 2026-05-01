document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('randomQuoteButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/williamwebsite/random-quote';
	});
});
