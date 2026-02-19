document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('valAccountBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/accounts';
	});
});
