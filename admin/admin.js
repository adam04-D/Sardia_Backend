// --- SECURITY CHECK ---
// This should be the ONLY declaration of 'token' in the global scope.
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'login.html';
}

// --- ELEMENT SELECTORS ---
const API_URL = 'http://localhost:5001/api/works';
const worksList = document.getElementById('works-list');
const addWorkForm = document.getElementById('add-work-form');
const titleInput = document.getElementById('title-input');
const excerptInput = document.getElementById('excerpt-input');
const imageInput = document.getElementById('image-input');
const fullContentInput = document.getElementById('full-content-input');
const formSubmitButton = addWorkForm.querySelector('button[type="submit"]');
const formTitle = document.querySelector('#add-work h2');
const logoutButton = document.getElementById('logout-btn');

let currentEditId = null;

// --- CORE FUNCTIONS ---

const fetchWorks = async () => {
    try {
        const response = await fetch(API_URL);
        const works = await response.json();
        worksList.innerHTML = '';
        works.forEach(work => {
            const workItem = document.createElement('li');
            workItem.className = 'work-item';
            workItem.innerHTML = `
                <img src="http://localhost:5001/${work.imageUrl.replace(/\\/g, '/')}" alt="${work.title}" class="work-item-image">
                <div class="work-item-content">
                    <h3>${work.title}</h3>
                    <p>${work.excerpt}</p>
                </div>
                <div class="work-item-actions">
                    <button class="btn-edit" data-id="${work._id}">Edit</button>
                    <button class="btn-delete" data-id="${work._id}">Delete</button>
                </div>
            `;
            worksList.appendChild(workItem);
        });
    } catch (error) {
        console.error('Error fetching works:', error);
    }
};

const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (currentEditId) {
        const workData = {
            title: titleInput.value,
            excerpt: excerptInput.value,
            fullContent: fullContentInput.value
        };
        try {
            const response = await fetch(`${API_URL}/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(workData)
            });
            if (response.ok) {
                resetForm();
                fetchWorks();
            } else { alert('Failed to update work.'); }
        } catch (error) { console.error('Error updating work:', error); }
    } else {
        const formData = new FormData();
        formData.append('title', titleInput.value);
        formData.append('excerpt', excerptInput.value);
        formData.append('fullContent', fullContentInput.value);
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });
            if (response.ok) {
                resetForm();
                fetchWorks();
            } else { alert('Failed to add work.'); }
        } catch (error) { console.error('Error adding work:', error); }
    }
};

const deleteWork = async (workId) => {
    if (!confirm('Are you sure you want to delete this work?')) return;
    try {
        const response = await fetch(`${API_URL}/${workId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (response.ok) {
            fetchWorks();
        } else {
            alert('Failed to delete work.');
        }
    } catch (error) {
        console.error('Error deleting work:', error);
    }
};


// --- HELPER FUNCTIONS ---

const setupEditForm = async (workId) => {
    try {
        const res = await fetch(`${API_URL}/${workId}`);
        const work = await res.json();

        currentEditId = workId;
        titleInput.value = work.title;
        excerptInput.value = work.excerpt;
        fullContentInput.value = work.fullContent;
        formTitle.textContent = 'Edit Work';
        formSubmitButton.textContent = 'Save Changes';
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Failed to fetch work details for editing:', error);
    }
};

const resetForm = () => {
    currentEditId = null;
    addWorkForm.reset();
    formTitle.textContent = 'Add New Work';
    formSubmitButton.textContent = 'Add Work';
};

const logout = () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
};


// --- EVENT LISTENERS ---

addWorkForm.addEventListener('submit', handleFormSubmit);

worksList.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('btn-delete')) {
        deleteWork(target.dataset.id);
    }
    if (target.classList.contains('btn-edit')) {
        setupEditForm(target.dataset.id);
    }
});

logoutButton.addEventListener('click', logout);

document.addEventListener('DOMContentLoaded', fetchWorks);