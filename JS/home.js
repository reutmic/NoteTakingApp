// // import {initializeApp} from 'firebase/app';
// import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
// // import { getAnalytics } from "firebase/analytics";
// // import {getAuth, onAuthStateChanged} from 'firebase/auth';
// import {getAuth, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
// // import {getFirestore} from 'firebase/firestore';
// import {getFirestore, collection, getDocs} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {getAuth, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import {getFirestore, collection, updateDoc, doc, deleteDoc, addDoc, getDoc, getDocs, onSnapshot, arrayUnion} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { firebaseApp } from '../JS/firebase.js';


"use strict";


// Initialize Firebase
// const notesApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
// const analytics = getAnalytics(app);

// detect auth state:
onAuthStateChanged(auth, user => {
    if (user != null) {
        console.log('logged in!');
    }
    else {
        console.log('no user');
    }
})


///////////////////////

// ====== functions ======

// Add a new note
async function addNote(title, content, category) {
    try {
        await addDoc(collection(db, "notes"), {
            title: title,
            content: content,
            category: category,
            timestamp: new Date(),
            history: []
        });
    } catch (e) {
        console.error("Error adding note: ", e);
    }
}

///////////

// get categories:
async function getCategoriesOptions() {
    const categoriesSelect = document.getElementById('noteCategory');
    categoriesSelect.innerHTML = ''; // Clear existing options

    try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        querySnapshot.forEach((doc) => {
            const category = doc.data();
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoriesSelect.appendChild(option);
        });
    } catch (e) {
        console.error('Error getting categories: ', e);
    }
}

///////////

async function viewNoteHistory(noteId) {
    const noteRef = doc(db, "notes", noteId);
    try {
        const noteDoc = await getDoc(noteRef);
        const noteData = noteDoc.data();

        const historyModal = document.getElementById('historyModal');
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        noteData.history.forEach((version, index) => {
            const historyItem = document.createElement('li');
            historyItem.className = 'list-group-item';
            historyItem.innerHTML = `
                <h5>Version ${index + 1}</h5>
                <p><strong>Title:</strong> ${version.title}</p>
                <p><strong>Content:</strong> ${version.content}</p>
                <p><strong>Category:</strong> ${version.category}</p>
                <p><strong>Timestamp:</strong> ${new Date(version.timestamp.seconds * 1000).toLocaleString()}</p>
                <button class="btn btn-secondary btn-sm" onclick="revertToVersion('${noteId}', ${index})">Revert to this version</button>
            `;
            historyList.appendChild(historyItem);
        });

        const modal = new bootstrap.Modal(historyModal);
        modal.show();
    } catch (e) {
        console.error('Error getting note history: ', e);
    }
}

window.viewNoteHistory = viewNoteHistory;

///////////

async function revertToVersion(noteId, versionIndex) {
    const noteRef = doc(db, "notes", noteId);
    try {
        const noteDoc = await getDoc(noteRef);
        const noteData = noteDoc.data();
        const version = noteData.history[versionIndex];

        // Add the current version to history before reverting
        const currentVersion = {
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            timestamp: noteData.timestamp,
        };

        await updateDoc(noteRef, {
            title: version.title,
            content: version.content,
            category: version.category,
            timestamp: new Date(),
            history: arrayUnion(currentVersion)
        });

        // Close the modal and refresh the notes display
        const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        modal.hide();
        // displayNotes();
    } catch (e) {
        console.error('Error reverting to version: ', e);
    }
}

window.revertToVersion = revertToVersion;

///////////

// display notes:
function displayNotes() {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    const querySnapshot = collection(db, "notes");
    onSnapshot(querySnapshot, (snapshot) => {
        notesList.innerHTML = ''; // Clear the current list of notes
        let row;
        let cardCount = 0;

        snapshot.forEach((doc) => {
            if (cardCount % 3 === 0) {
                row = document.createElement('div');
                row.className = 'row mb-3';
                notesList.appendChild(row);
            }

            const note = doc.data();
            const col = document.createElement('div');
            col.className = 'col-md-4';

            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title text-center">${note.title}</h5>
                    <p class="card-text">${note.content}</p>
                    <p class="card-text"><small class="text-muted">Category: ${note.category}</small></p>
                    <button class="btn btn-dark btn-sm" onclick="viewNoteHistory('${doc.id}')">View History</button>
                    <button class="btn btn-warning btn-sm" onclick="editNotePrompt('${doc.id}', \`${note.title}\`, \`${note.content}\`, \`${note.category}\`)">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNotePrompt('${doc.id}')">Delete</button>
                </div>
            `;

            col.appendChild(card);
            row.appendChild(col);
            cardCount++;
        });
    }, (error) => {
        console.error("Error getting notes: ", error);
    });
}

///////////

// edit note prompt:
window.editNotePrompt = async function (id, title, content, category) {
    const newTitle = prompt("Edit Note Title", title);
    const newContent = prompt("Edit Note Content", content);
    const newCategory = prompt('Edit Note Category', category);

    if (newTitle !== null && newContent !== null && newCategory !== null) {
        await editNote(id, newTitle, newContent, newCategory);
    }
}

// edit note:
async function editNote(id, newTitle, newContent, newCategory) {
    const noteRef = doc(db, "notes", id);

    try {
        const noteDoc = await getDoc(noteRef);
        const noteData = noteDoc.data();

        // add the current version to the note's history:
        const previousVersion = {
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            timestamp: noteData.timestamp,
        };


        await updateDoc(noteRef, {
            title: newTitle,
            content: newContent,
            category: newCategory,
            timestamp: new Date(),
            history: arrayUnion(previousVersion)
        });
    } catch (e) {
        console.error("Error editing note: ", e);
    }
}

///////////

// Delete note prompt
window.deleteNotePrompt = async function (id) {
    if (confirm("Are you sure you want to delete this note?")) {
        await deleteNote(id);
    }
}

// Delete a note
async function deleteNote(id) {
    const noteRef = doc(db, "notes", id);

    try {
        await deleteDoc(noteRef);
    } catch (e) {
        console.error("Error deleting note: ", e);
    }
}

///////////





///////////

document.addEventListener('DOMContentLoaded', async (event) => {
    displayNotes();
    await getCategoriesOptions();
    const noteForm = document.getElementById('noteForm');

    // handle new note form submission:
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        const category = document.getElementById('noteCategory').value;
        await addNote(title, content, category);
        document.getElementById('noteForm').reset();
    });



});

///////////


