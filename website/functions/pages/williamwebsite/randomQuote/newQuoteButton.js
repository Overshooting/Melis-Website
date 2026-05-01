document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('newQuoteBtn');
    const quoteDisplay = document.getElementById('quoteDisplay');
    if (!btn) return;

    const quotes = ["I do as I please", "Please don't say that...", "I'm playing Decaying Winter", "You people...", "They buffed Naoya? Utter woke nonsense.",
        "Bro just watch redo of healer", "These [REDACTED] move with the finesse of a beat child with nothing else in their life", "I'm zerking off"];
    const authors = ["Chilly Silly Willy", "William \"The Honored One\" Ryu", "The Nightmare before Willsmas", "The Unkillable Demon King", 
        "The Undying Dragon", "Off-meta Warrior", "The Frozen King of Junior Varsity Soccer", "The Eternal Frown", "Guy who presented and got at least a 2", 
        "The Phantom of Roxboro Court", ];
    btn.addEventListener('click', function (e) {
        e.preventDefault();

        const randomQuotesIndex = Math.floor(Math.random() * quotes.length);
        const randomAuthorsIndex = Math.floor(Math.random() * authors.length);

        quoteDisplay.textContent = `"${quotes[randomQuotesIndex]}" - ${authors[randomAuthorsIndex]}`;
    });
});

