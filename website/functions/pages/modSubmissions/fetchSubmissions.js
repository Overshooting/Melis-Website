document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('submissions');
    if (!container) return;

    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');

    let currentPage = 1;
    let totalPages = 1;

    async function loadPage(page) {
        try {
            const response = await fetch(`/api/mod-submissions/fetch-submissions?page=${page}`);
            const data = await response.json();

            container.innerHTML = '';

            currentPage = data.page;
            totalPages = data.totalPages;
            currentPageSpan.textContent = `Page ${currentPage} / ${totalPages}`;

            data.submissions.forEach(submission => {

                const card = document.createElement('div');
                card.className = 'submission';
                
                const title = document.createElement('h3');
                title.textContent = submission.art_title;

                const author = document.createElement('p');
                author.textContent = `By: ${submission.artist_name}`;

                const date = document.createElement('p');
                const uploadDate = new Date(submission.upload_date);
                date.textContent = `Uploaded on: ${uploadDate.toLocaleDateString()}`;

                const image = document.createElement('img');
                image.src = `/mod-submissions/submitted-art/${submission.filename}`;
                image.loading = 'lazy';

                card.appendChild(image);
                card.appendChild(title);
                card.appendChild(author);
                card.appendChild(date);

                container.appendChild(card);
                
            });

            if (page > totalPages) {
                totalPages = page;
                currentPageSpan.textContent = `Page ${currentPage} / ${totalPages}`;
            }

            updateButtons()
        } catch (error) {
            container.innerHTML = '<p>An error occurred while fetching submissions: ' + error + '</p>';
            currentPageSpan.textContent = '1/1';
            updateButtons();
        }
    }

    function updateButtons() {
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPage(currentPage + 1);
        }
    });

    loadPage(currentPage);
});