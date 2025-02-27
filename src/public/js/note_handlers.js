let editor = null;

document.addEventListener('DOMContentLoaded', () => {
    const editorElement = document.querySelector('#noteEditor');
    if (editorElement) {
        ClassicEditor
            .create(editorElement, {
                toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'insertTable'],
                placeholder: 'Type your note here...'
            })
            .then(newEditor => {
                editor = newEditor;
            })
            .catch(error => {
                console.error(error);
            });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Get item ID from URL
    const itemId = window.location.pathname.split('/').pop();
    
    // Fetch notes
    const response = await fetch(`/items/${itemId}/notes`);
    const notes = await response.json();
    
    // Display notes
    const notesContainer = document.querySelector('.space-y-4');
    // REPLACE THE EXISTING notes.forEach HERE with the new template
    notes.forEach(note => {
        notesContainer.innerHTML += `
            <div class="bg-white rounded-lg shadow-lg p-6" data-note-id="${note.id}">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-semibold">${note.title}</h3>
                    <div class="flex gap-2">
                        <span class="text-sm text-gray-500">${new Date(note.created_at).toLocaleDateString()}</span>
                        <button onclick="editNote('${note.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                        <button onclick="deleteNote('${note.id}')" class="text-red-600 hover:text-red-800">Delete</button>
                    </div>
                </div>
                <div class="prose max-w-none">${note.content}</div>
                ${note.images && note.images.length ? `
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        ${note.images.map(image => `<img src="${image}" alt="" class="rounded-lg">`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const editEditorElement = document.querySelector('#editNoteEditor');
    if (editEditorElement) {
        ClassicEditor
            .create(editEditorElement)
            .then(newEditor => {
                editEditor = newEditor;
            })
            .catch(error => {
                console.error(error);
            });
    }
});

document.getElementById('editNoteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = window.location.pathname.split('/').pop();
    const noteId = document.getElementById('editNoteId').value;
    
    const formData = new FormData(e.target);
    formData.set('content', editEditor.getData());
    
    try {
        const response = await fetch(`/items/${itemId}/notes/${noteId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error updating note:', error);
    }
});

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    const itemId = window.location.pathname.split('/').pop();
    try {
        const response = await fetch(`/items/${itemId}/notes/${noteId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            document.querySelector(`[data-note-id="${noteId}"]`).remove();
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

async function editNote(noteId) {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    const title = noteElement.querySelector('h3').textContent;
    const content = noteElement.querySelector('.prose').innerHTML;
    
    document.getElementById('editNoteId').value = noteId;
    document.getElementById('editNoteTitle').value = title;
    editEditor.setData(content);
    
    toggleNoteModal('editNote');
}



function toggleNoteModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden') && editor) {
            editor.setData(''); // Clear editor when opening modal
        }
    }
}
