document.addEventListener('DOMContentLoaded', function () {
	var btn = document.getElementById('openSubmitButton');
	if (!btn) return;
	btn.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/mod-submissions/submit-art';
	});
});