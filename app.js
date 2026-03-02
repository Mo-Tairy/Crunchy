document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    let experiments = [];
    let notesData = {
        text: "",
        shoppingList: []
    };

    // --- DOM Elements ---
    const form = document.querySelector('#experiment-form');
    const expIdInput = document.querySelector('#exp-id');
    const btnClear = document.querySelector('#btn-clear');
    const searchBar = document.querySelector('#search-bar');
    const experimentsList = document.querySelector('#experiments-list');
    
    // Notes & Shopping list elements
    const mainNotes = document.querySelector('#main-notes');
    const btnSaveNotes = document.querySelector('#btn-save-notes');
    const saveStatus = document.querySelector('#save-status');
    const shoppingForm = document.querySelector('#shopping-form');
    const newItemInput = document.querySelector('#new-item');
    const shoppingListEl = document.querySelector('#shopping-list');

    // Default Date to Today
    document.querySelector('#exp-date').valueAsDate = new Date();

    // --- Initialization ---
    function loadData() {
        // Load Experiments
        const storedExperiments = localStorage.getItem('experiments_data');
        if (storedExperiments) {
            try {
                experiments = JSON.parse(storedExperiments);
            } catch(e) {
                console.error("Failed to parse experiments_data", e);
                experiments = [];
            }
        }

        // Load Notes & Shopping List
        const storedNotes = localStorage.getItem('notes_data');
        if (storedNotes) {
            try {
                const parsed = JSON.parse(storedNotes);
                if (typeof parsed === 'object' && parsed !== null) {
                    notesData = { ...notesData, ...parsed };
                } else {
                    // Fallback if plain text was somehow saved
                    notesData.text = String(storedNotes);
                }
            } catch(e) {
                notesData.text = String(storedNotes); 
            }
        }
        
        mainNotes.value = notesData.text || '';
        renderExperiments();
        renderShoppingList();
    }

    function saveExperiments() {
        localStorage.setItem('experiments_data', JSON.stringify(experiments));
        renderExperiments();
    }

    function saveNotesData() {
        notesData.text = mainNotes.value;
        localStorage.setItem('notes_data', JSON.stringify(notesData));
        showSaveStatus();
    }

    let saveTimeout;
    function autoSaveNotes() {
        clearTimeout(saveTimeout);
        saveStatus.textContent = "Saving...";
        saveStatus.style.opacity = 1;
        saveTimeout = setTimeout(() => {
            saveNotesData();
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    function showSaveStatus() {
        saveStatus.textContent = "Saved";
        saveStatus.style.opacity = 1;
        setTimeout(() => {
            saveStatus.style.opacity = 0;
        }, 2000);
    }

    // --- Event Listeners: Notes & Shopping List ---
    mainNotes.addEventListener('input', autoSaveNotes);
    
    btnSaveNotes.addEventListener('click', () => {
        clearTimeout(saveTimeout);
        saveNotesData();
    });

    shoppingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = newItemInput.value.trim();
        if (text) {
            notesData.shoppingList.push({ id: Date.now(), text, checked: false });
            newItemInput.value = '';
            saveNotesData();
            renderShoppingList();
        }
    });

    function renderShoppingList() {
        shoppingListEl.innerHTML = '';
        if(!notesData.shoppingList) notesData.shoppingList = [];
        
        notesData.shoppingList.forEach(item => {
            const li = document.createElement('li');
            li.className = `shopping-item ${item.checked ? 'checked' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" ${item.checked ? 'checked' : ''}>
                <span>${escapeHtml(item.text)}</span>
                <button type="button" class="btn-delete-item" title="Remove item">&times;</button>
            `;

            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                item.checked = checkbox.checked;
                saveNotesData();
                renderShoppingList();
            });

            const deleteBtn = li.querySelector('.btn-delete-item');
            deleteBtn.addEventListener('click', () => {
                notesData.shoppingList = notesData.shoppingList.filter(i => i.id !== item.id);
                saveNotesData();
                renderShoppingList();
            });

            shoppingListEl.appendChild(li);
        });
    }

    // --- Form Handling ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = expIdInput.value;
        const newExp = {
            id: id ? id : Date.now().toString(),
            name: document.querySelector('#exp-name').value,
            date: document.querySelector('#exp-date').value,
            amount: document.querySelector('#exp-amount').value,
            marinade: document.querySelector('#exp-marinade').value,
            coating: document.querySelector('#exp-coating').value,
            frying: document.querySelector('#exp-frying').value,
            notes: document.querySelector('#exp-notes').value,
            rating: document.querySelector('#exp-rating').value,
            desc: document.querySelector('#exp-desc').value,
            mistakes: document.querySelector('#exp-mistakes').value,
            timestamp: Date.now()
        };

        if (id) {
            // Update existing
            const index = experiments.findIndex(exp => exp.id === id);
            if(index > -1) {
                // preserve timestamp if exists, though we update it above
                // let's just replace
                experiments[index] = newExp;
            }
        } else {
            // Add new
            experiments.unshift(newExp); // Add to top
        }

        saveExperiments();
        clearForm();
        
        // scroll to list only if mobile where it might be far down
        if (window.innerWidth <= 768) {
            document.querySelector('.list-card').scrollIntoView({ behavior: 'smooth' });
        }
    });

    btnClear.addEventListener('click', clearForm);

    function clearForm() {
        form.reset();
        expIdInput.value = '';
        document.querySelector('#exp-date').valueAsDate = new Date();
        document.querySelector('#btn-save').textContent = 'Save Experiment';
    }

    // --- Rendering Experiments ---
    searchBar.addEventListener('input', renderExperiments);

    function renderExperiments() {
        const query = searchBar.value.toLowerCase();
        experimentsList.innerHTML = '';
        
        const filtered = experiments.filter(exp => {
            return (
                (exp.name || '').toLowerCase().includes(query) ||
                (exp.marinade || '').toLowerCase().includes(query) ||
                (exp.coating || '').toLowerCase().includes(query) ||
                (exp.notes || '').toLowerCase().includes(query) ||
                (exp.desc || '').toLowerCase().includes(query) ||
                (exp.mistakes || '').toLowerCase().includes(query)
            );
        });

        if (filtered.length === 0) {
            experimentsList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 2rem 0;">No experiments found.</p>';
            return;
        }

        filtered.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'exp-card';
            
            card.innerHTML = `
                <div class="exp-card-header">
                    <div>
                        <div class="exp-title">${escapeHtml(exp.name)}</div>
                        <div class="exp-meta">
                            <span>📅 ${exp.date}</span>
                            <span>🐔 ${escapeHtml(exp.amount || '-')}</span>
                        </div>
                    </div>
                    <div class="exp-rating-badge">★ ${exp.rating}/10</div>
                </div>
                <div class="exp-details">
                    ${createSection('Marinade', exp.marinade)}
                    ${createSection('Coating Mix', exp.coating)}
                    ${createSection('Frying Details', exp.frying)}
                    ${createSection('Cooking Notes', exp.notes)}
                    ${createSection('Result Description', exp.desc)}
                    ${createSection('Mistakes / Adjustments', exp.mistakes)}
                    
                    <div class="exp-actions">
                        <button type="button" class="btn btn-secondary btn-edit">Edit</button>
                        <button type="button" class="btn btn-secondary btn-delete" style="color: #d9534f; border-color: #fad2d1; background: #fff5f5;">Delete</button>
                    </div>
                </div>
            `;

            // Expand/Collapse toggle
            const header = card.querySelector('.exp-card-header');
            header.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            // Edit
            const editBtn = card.querySelector('.btn-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadIntoForm(exp);
            });

            // Delete
            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm('Are you sure you want to delete this experiment?')) {
                    experiments = experiments.filter(item => item.id !== exp.id);
                    saveExperiments();
                }
            });

            experimentsList.appendChild(card);
        });
    }

    function createSection(title, content) {
        if (!content || !content.trim()) return '';
        return `
            <div class="detail-section">
                <h4>${title}</h4>
                <p>${escapeHtml(content)}</p>
            </div>
        `;
    }

    function loadIntoForm(exp) {
        expIdInput.value = exp.id;
        document.querySelector('#exp-name').value = exp.name || '';
        document.querySelector('#exp-date').value = exp.date || '';
        document.querySelector('#exp-amount').value = exp.amount || '';
        document.querySelector('#exp-marinade').value = exp.marinade || '';
        document.querySelector('#exp-coating').value = exp.coating || '';
        document.querySelector('#exp-frying').value = exp.frying || '';
        document.querySelector('#exp-notes').value = exp.notes || '';
        document.querySelector('#exp-rating').value = exp.rating || '5';
        document.querySelector('#exp-desc').value = exp.desc || '';
        document.querySelector('#exp-mistakes').value = exp.mistakes || '';

        document.querySelector('#btn-save').textContent = 'Update Experiment';
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    }

    function escapeHtml(unsafe) {
        if(!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Go!
    loadData();

});
