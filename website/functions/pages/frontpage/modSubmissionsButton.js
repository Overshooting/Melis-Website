document.addEventListener('DOMContentLoaded', function () {
	const btn = document.getElementById('modSubmissionsButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/mod-submissions';
	});
});