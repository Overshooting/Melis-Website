document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('homeBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/';
	});
});
