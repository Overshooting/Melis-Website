document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('backBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/accounts';
	});
});