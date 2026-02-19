document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('randomQuoteButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/random-quote';
	});
});
