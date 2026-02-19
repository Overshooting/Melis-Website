document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('newQuoteBtn');
    var quoteDisplay = document.getElementById('quoteDisplay');
    if (!btn) return;

    var quotes = ["I do as I please", "Please don't say that...", "I'm playing Decaying Winter", "You people...", "They buffed Naoya? Utter woke nonsense.",
        "Bro just watch redo of healer", "These [REDACTED] move with the finesse of a beat child with nothing else in their life", "I'm zerking off"];
    var authors = ["Chilly Silly Willy", "William \"The Honored One\" Ryu:", "The Nightmare before Willsmas", "The Unkillable Demon King", 
        "The Undying Dragon", "Off-meta Warrior", "The Frozen King of Junior Varsity Soccer", "The Eternal Frown", "Guy who presented and got at least a 2", 
        "The Phantom of Roxboro Court", ];
    btn.addEventListener('click', function (e) {
        e.preventDefault();

        var randomQuotesIndex = Math.floor(Math.random() * quotes.length);
        var randomAuthorsIndex = Math.floor(Math.random() * authors.length);

        quoteDisplay.textContent = `"${quotes[randomQuotesIndex]}" - ${authors[randomAuthorsIndex]}`;
    });
});

