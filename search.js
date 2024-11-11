// Search function to filter flashcard sets
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const flashcardSetList = document.getElementById('flashcard-set-list');

    // Show the search bar when flashcard sets are displayed
    function showSearchBar() {
        searchBar.style.display = 'block';

        // Add input event listener to search bar
        searchBar.addEventListener('input', () => {
            const filter = searchBar.value.toLowerCase();
            const sets = flashcardSetList.querySelectorAll('.set-container');

            sets.forEach((setContainer) => {
                const setButton = setContainer.querySelector('button');
                const deleteButton = setContainer.querySelector('.delete-btn');
                const setName = setButton.textContent.toLowerCase();

                // Check if the set name matches the search filter
                const matchesSearch = setName.includes(filter);

                // Show/hide the set container (button and delete button)
                setContainer.style.display = matchesSearch ? 'flex' : 'none';

                // Only show the delete button if the set is visible
                if (deleteButton) {
                    deleteButton.style.display = matchesSearch ? 'inline-block' : 'none';
                }
            });
        });
    }

    // Hook into existing function to display sets (you need to call this function from your existing code)
    window.showSearchBar = showSearchBar;
});
