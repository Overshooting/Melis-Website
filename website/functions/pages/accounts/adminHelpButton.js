document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('helpBtn');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/accounts/admin-help';
	});
});