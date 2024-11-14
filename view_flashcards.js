const firebaseConfig = {
    apiKey: "AIzaSyBxR-gB1srBMUlQNvwOy1M2fVHIKaClTZs",
    authDomain: "sweflashcardwebsite.firebaseapp.com",
    projectId: "sweflashcardwebsite",
    storageBucket: "sweflashcardwebsite.appspot.com",
    messagingSenderId: "1017040813605",
    appId: "1:1017040813605:web:fe254a4afe244d341909cc",
    measurementId: "G-NHEQY035NK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Function to check if the current user is an admin
async function checkIfAdmin() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists && userDoc.data().role === 'admin';
        } catch (error) {
            console.error("Error checking if user is admin:", error);
            return false;
        }
    }
    return false;
}

// Function to show and enable the search bar
function showSearchBar() {
    const searchBar = document.getElementById('search-bar');
    searchBar.style.display = 'block';

    if (!searchBar.dataset.listenerAdded) {
        searchBar.addEventListener('input', () => {
            const filter = searchBar.value.toLowerCase();
            const sets = document.querySelectorAll('#flashcard-set-list .set-container');

            sets.forEach((setContainer) => {
                const setButton = setContainer.querySelector('button');
                const setName = setButton.textContent.toLowerCase();
                const deleteButton = setContainer.querySelector('.delete-btn');

                const matchesSearch = setName.includes(filter);
                setContainer.style.display = matchesSearch ? 'flex' : 'none';

                if (deleteButton) {
                    deleteButton.style.display = (matchesSearch && setContainer.style.display !== 'none') ? 'inline-block' : 'none';
                }
            });
        });
        searchBar.dataset.listenerAdded = 'true';
    }
}

// Function to hide and reset the search bar
function hideSearchBar() {
    const searchBar = document.getElementById('search-bar');
    searchBar.style.display = 'none';
    searchBar.value = '';
}

// Function to reset the layout of subject buttons after back button is pressed
function resetSubjectButtonLayout() {
    const subjectList = document.getElementById('subject-list');

    // Recalculate the layout and apply the necessary styles
    subjectList.style.display = 'flex';
    subjectList.style.flexWrap = 'wrap';
    subjectList.style.justifyContent = 'center'; // Recenter the buttons
}

async function loadFlashcardSetsBySubject(subject) {
    const flashcardSetList = document.getElementById('flashcard-set-list');
    const searchBar = document.getElementById('search-bar');

    // Hide the edit button whenever a new subject is loaded
    const editButton = document.getElementById('edit-btn');
    editButton.style.display = 'none';  // Ensure the edit button is hidden when we load new sets

    flashcardSetList.innerHTML = '';
    document.getElementById('subject-list').style.display = 'none';
    flashcardSetList.style.display = 'block';
    document.getElementById('back-btn').style.display = 'block';

    try {
        const setsSnapshot = await db.collection('flashcardsets').doc(subject).collection('sets').get();
        if (setsSnapshot.empty) {
            flashcardSetList.innerHTML = `<p>No flashcard sets found for ${subject}.</p>`;
        } else {
            const isAdmin = await checkIfAdmin();
            setsSnapshot.forEach((doc) => {
                const setData = doc.data();
                const setId = doc.id;

                const setContainer = document.createElement('div');
                setContainer.classList.add('set-container');

                const button = document.createElement('button');
                button.textContent = setData.name;
                button.onclick = () => loadFlashcardSetDetails(subject, setId);
                setContainer.appendChild(button);

                // Calculate the rating as a percentage
                const likes = setData.likes || 0;
                const dislikes = setData.dislikes || 0;
                const totalVotes = likes + dislikes;
                let ratingPercentage = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 0;

                // Create the rating text element
                const ratingText = document.createElement('span');
                ratingText.textContent = `Rating: ${ratingPercentage}%`;
                ratingText.style.marginLeft = 'auto'; // Align to the right within the container
                ratingText.style.paddingLeft = '10px'; // Optional: Add some spacing

                setContainer.appendChild(ratingText);

                if (isAdmin) {
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('delete-btn');
                    deleteButton.onclick = () => deleteFlashcardSet(subject, setId);
                    setContainer.appendChild(deleteButton);
                }

                flashcardSetList.appendChild(setContainer);
            });

            showSearchBar();
        }
    } catch (error) {
        console.error("Error loading flashcard sets for subject:", error);
        flashcardSetList.innerHTML = `<p>Failed to load flashcard sets. Please try again later.</p>`;
    }
}

// Display the edit button if the user is the creator
function showEditButtonIfCreator(setCreatorUID, subject, setId) {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === setCreatorUID) {
        const editButton = document.getElementById('edit-btn');
        editButton.style.display = 'inline-block'; // Display the edit button
        editButton.onclick = () => redirectToEditPage(subject, setId); // Pass subject and setId
    }
}


// Function to load the flashcard set details (including likes/dislikes)
async function loadFlashcardSetDetails(subject, setId) {
    const flashcardSetListDiv = document.getElementById('flashcard-set-list');
    const flashcardDetailsDiv = document.getElementById('flashcard-details');
    const setNameElement = document.getElementById('set-name');
    const creatorNameElement = document.getElementById('creator-name');
    const flashcardsContainer = document.getElementById('flashcards-container');
    const likesDislikesDiv = document.getElementById('likes-dislikes');

    flashcardsContainer.innerHTML = '';
    likesDislikesDiv.innerHTML = ''; // Clear previous likes/dislikes buttons

    try {
        const setRef = db.collection('flashcardsets').doc(subject).collection('sets').doc(setId);
        const setDoc = await setRef.get();

        if (setDoc.exists) {
            let setData = setDoc.data();

            showEditButtonIfCreator(setData.creator, subject, setId); // Pass subject and setId to showEditButtonIfCreator

            // Set the name and creator
            setNameElement.textContent = setData.name;
            creatorNameElement.textContent = await getUsernameByUID(setData.creator);

            // Display likes and dislikes buttons
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userId = currentUser.uid;
                const userVote = setData.voters[userId] || null; // Get current user's vote status

                // Create the like button
                const likeButton = document.createElement('button');
                likeButton.textContent = `Likes: ${setData.likes}`;
                likeButton.classList.add('styled-button'); // Adding a CSS class
                likeButton.onclick = () => handleVote('like', setId, userId, userVote, subject);
                if (userVote === 'liked') {
                    likeButton.disabled = true; // Disable if user has already liked
                }
                likesDislikesDiv.appendChild(likeButton);

                // Create the dislike button
                const dislikeButton = document.createElement('button');
                dislikeButton.textContent = `Dislikes: ${setData.dislikes}`;
                dislikeButton.classList.add('styled-button'); // Adding a CSS class
                dislikeButton.onclick = () => handleVote('dislike', setId, userId, userVote, subject);
                if (userVote === 'disliked') {
                    dislikeButton.disabled = true; // Disable if user has already disliked
                }
                likesDislikesDiv.appendChild(dislikeButton);
            }

            // Show flashcards
            flashcardSetListDiv.style.display = 'none';
            flashcardDetailsDiv.style.display = 'block';
            hideSearchBar();

            setData.flashcards.forEach((flashcard) => {
                const flashcardDiv = document.createElement('div');
                flashcardDiv.classList.add('flashcard');

                const frontDiv = document.createElement('div');
                frontDiv.classList.add('front');
                frontDiv.innerHTML = ` ${flashcard.front}`;

                const backDiv = document.createElement('div');
                backDiv.classList.add('back');
                backDiv.innerHTML = ``;

                flashcard.back.forEach((option) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.classList.add('option');
                    if (option.isCorrect) {
                        optionDiv.classList.add('correct');
                    }
                    optionDiv.textContent = option.option;
                    backDiv.appendChild(optionDiv);
                });

                flashcardDiv.appendChild(frontDiv);
                flashcardDiv.appendChild(backDiv);

                flashcardsContainer.appendChild(flashcardDiv);
            });
        } else {
            alert('Flashcard set not found');
        }
    } catch (error) {
        console.error("Error loading flashcard set details:", error);
    }
}


async function handleVote(type, setId, userId, userVote, subject) {
    const setRef = db.collection('flashcardsets').doc(subject).collection('sets').doc(setId);

    try {
        const setDoc = await setRef.get();
        const setData = setDoc.data();

        if (!setData.voters) {
            setData.voters = {}; // Initialize voters if it does not exist
        }

        // Check if the user has already voted
        if (setData.voters[userId] === type) {
            alert('You have already voted.');
            return;
        }

        // Prepare updates for votes and voters
        const updateData = {};
        if (type === 'like') {
            updateData.likes = firebase.firestore.FieldValue.increment(1);
            if (setData.voters[userId] === 'dislike') {
                updateData.dislikes = firebase.firestore.FieldValue.increment(-1); // If switching from dislike, decrement dislikes
            }
        } else if (type === 'dislike') {
            updateData.dislikes = firebase.firestore.FieldValue.increment(1);
            if (setData.voters[userId] === 'like') {
                updateData.likes = firebase.firestore.FieldValue.increment(-1); // If switching from like, decrement likes
            }
        }

        // Update votes and voters map in Firestore
        await setRef.update({
            ...updateData,
            [`voters.${userId}`]: type // Update the user's vote in the voters map
        });

        // After updating, refresh the UI
        updateLikeDislikeButtons(type, setId, subject);

    } catch (error) {
        console.error("Error updating votes:", error);
    }
}

// Function to update the like/dislike buttons on the UI
async function updateLikeDislikeButtons(userVote, setId, subject) {
    const setRef = db.collection('flashcardsets').doc(subject).collection('sets').doc(setId);
    const setDoc = await setRef.get();
    const setData = setDoc.data();

    const likesButton = document.querySelector('#likes-dislikes button:first-child');
    const dislikesButton = document.querySelector('#likes-dislikes button:last-child');

    // Update the text of the like/dislike buttons
    likesButton.textContent = `Likes: ${setData.likes}`;
    dislikesButton.textContent = `Dislikes: ${setData.dislikes}`;

    // Disable the button of the user's selected vote
    const currentUser = auth.currentUser;
    if (currentUser) {
        const userVote = setData.voters[currentUser.uid];
        if (userVote === 'liked') {
            likesButton.disabled = true;
            dislikesButton.disabled = false; // Allow user to click the dislike button
        } else if (userVote === 'disliked') {
            dislikesButton.disabled = true;
            likesButton.disabled = false; // Allow user to click the like button
        }
    }
}

// Fetch the username by user UID
async function getUsernameByUID(userUID) {
    try {
        const userDoc = await db.collection('users').doc(userUID).get();
        return userDoc.exists ? userDoc.data().username : 'Unknown';
    } catch (error) {
        console.error("Error fetching username by UID:", error);
        return 'Unknown';
    }
}

// Function to delete a flashcard set
async function deleteFlashcardSet(subject, setId) {
    const confirmation = confirm('Are you sure you want to delete this flashcard set?');
    if (confirmation) {
        try {
            await db.collection('flashcardsets').doc(subject).collection('sets').doc(setId).delete();
            alert('Flashcard set deleted successfully!');
            loadFlashcardSetsBySubject(subject);  // Reload the sets
        } catch (error) {
            console.error("Error deleting flashcard set:", error);
            alert('Failed to delete flashcard set.');
        }
    }
}

// Function to show the list of subjects again
function showSubjects() {
    document.getElementById('subject-list').style.display = 'block';
    document.getElementById('flashcard-set-list').style.display = 'none';
    document.getElementById('flashcard-details').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    hideSearchBar();
    resetSubjectButtonLayout();  // Reset the layout of subject buttons
}

function redirectToEditPage(subject, setId) {
    // Redirects the user to the edit page with necessary parameters
    const queryParams = new URLSearchParams({
        subject: subject, // Pass subject as a query parameter
        setId: setId      // Pass setId as a query parameter
    });
    window.location.href = `edit_flashcards.html?${queryParams.toString()}`;
}
