// Initialize Firebase
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

// Assume the set ID is passed in the URL query parameters (e.g., ?setId=abc123)
const urlParams = new URLSearchParams(window.location.search);
const setId = urlParams.get('setId');
const subject = urlParams.get('subject');  // You could also use this to ensure the user doesn't change the subject

// Fetch the set details from Firestore
async function loadFlashcardSet() {
    try {
        const setDoc = await db.collection('flashcardsets').doc(subject).collection('sets').doc(setId).get();
        if (setDoc.exists) {
            const setData = setDoc.data();
            document.getElementById('setName').textContent = setData.name;  // Display set name
            document.getElementById('setSubject').textContent = `Subject: ${subject}`;  // Display subject (not editable)

            // Populate the flashcards
            const flashcardsContainer = document.getElementById('flashcardsContainer');
            flashcardsContainer.innerHTML = '';  // Clear any previous flashcards

            setData.flashcards.forEach((flashcard, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('flashcard');

                // Now we expect the 'back' field to be an array of objects with 'option' and 'isCorrect'
                const options = flashcard.back || [
                    { option: '', isCorrect: false },
                    { option: '', isCorrect: false },
                    { option: '', isCorrect: false },
                    { option: '', isCorrect: false }
                ];

                cardDiv.innerHTML = `
                    <label for="front${index}">Front:</label>
                    <input type="text" id="front${index}" value="${flashcard.front || ''}" required>
                    
                    <!-- Multiple choice options -->
                    <label for="option1${index}">Option 1:</label>
                    <input type="text" id="option1${index}" value="${options[0].option}" required>
                    <input type="radio" name="correctAnswer${index}" value="0" ${options[0].isCorrect ? 'checked' : ''}> Correct

                    <label for="option2${index}">Option 2:</label>
                    <input type="text" id="option2${index}" value="${options[1].option}" required>
                    <input type="radio" name="correctAnswer${index}" value="1" ${options[1].isCorrect ? 'checked' : ''}> Correct

                    <label for="option3${index}">Option 3:</label>
                    <input type="text" id="option3${index}" value="${options[2].option}" required>
                    <input type="radio" name="correctAnswer${index}" value="2" ${options[2].isCorrect ? 'checked' : ''}> Correct

                    <label for="option4${index}">Option 4:</label>
                    <input type="text" id="option4${index}" value="${options[3].option}" required>
                    <input type="radio" name="correctAnswer${index}" value="3" ${options[3].isCorrect ? 'checked' : ''}> Correct
                `;
                flashcardsContainer.appendChild(cardDiv);
            });
        } else {
            alert('Flashcard set not found');
        }
    } catch (error) {
        console.error('Error loading flashcard set: ', error);
    }
}

// Save changes to Firestore
async function saveFlashcards(event) {
    event.preventDefault();  // Prevent form submission

    try {
        const updatedFlashcards = [];
        const flashcardsContainer = document.getElementById('flashcardsContainer');

        // Get the updated flashcard values
        const flashcardInputs = flashcardsContainer.querySelectorAll('.flashcard');
        flashcardInputs.forEach((cardDiv, index) => {
            const front = cardDiv.querySelector(`#front${index}`).value;

            // Get the options from the back (now split into 4 separate options)
            const options = [
                { option: cardDiv.querySelector(`#option1${index}`).value, isCorrect: cardDiv.querySelector(`[name="correctAnswer${index}"][value="0"]`).checked },
                { option: cardDiv.querySelector(`#option2${index}`).value, isCorrect: cardDiv.querySelector(`[name="correctAnswer${index}"][value="1"]`).checked },
                { option: cardDiv.querySelector(`#option3${index}`).value, isCorrect: cardDiv.querySelector(`[name="correctAnswer${index}"][value="2"]`).checked },
                { option: cardDiv.querySelector(`#option4${index}`).value, isCorrect: cardDiv.querySelector(`[name="correctAnswer${index}"][value="3"]`).checked }
            ];

            updatedFlashcards.push({
                front,
                back: options,  // Store the options array as the back field
            });
        });

        // Update the flashcard set in Firestore
        await db.collection('flashcardsets').doc(subject).collection('sets').doc(setId).update({
            flashcards: updatedFlashcards
        });

        alert('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes: ', error);
    }
}

// Back button handler
function goBack() {
    window.history.back(); // Goes back to the previous page
}

// Event listener for saving changes
document.getElementById('flashcardForm').addEventListener('submit', saveFlashcards);

// Load the flashcard set when the page loads
window.onload = loadFlashcardSet;
