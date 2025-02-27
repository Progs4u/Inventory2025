let searchTimeout;
const QR_UUID = window.location.pathname.split('/').pop();

function handleTypeChange() {
    const type = document.getElementById('assignmentType').value;
    const searchSection = document.getElementById('searchSection');
    
    if (type) {
        searchSection.classList.remove('hidden');
        document.getElementById('searchInput').placeholder = `Search existing ${type}s...`;
    } else {
        searchSection.classList.add('hidden');
    }
    
    // Reset search results and form
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('assignmentForm').classList.add('hidden');
}

async function handleSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('searchInput').value;
    const type = document.getElementById('assignmentType').value;
    
    if (query.length < 2) return;
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/search/${type}s?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            displaySearchResults(results, type);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }, 300);
}

function displaySearchResults(results, type) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No results found</p>';
        return;
    }
    
    const list = document.createElement('div');
    list.className = 'space-y-2';
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'p-3 border rounded hover:bg-gray-50 cursor-pointer';
        item.onclick = () => selectItem(result, type);
        item.innerHTML = `
            <p class="font-bold">${result.name}</p>
            ${result.description ? `<p class="text-sm text-gray-600">${result.description}</p>` : ''}
        `;
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

function selectItem(item, type) {
    document.getElementById('selectedId').value = item.id;
    document.getElementById('selectedType').value = type;
    document.getElementById('selectedDisplay').textContent = `${type}: ${item.name}`;
    document.getElementById('assignmentForm').classList.remove('hidden');
}

async function handleAssignment(event) {
    event.preventDefault();
    
    const type = document.getElementById('selectedType').value;
    const id = document.getElementById('selectedId').value;
    
    try {
        const response = await fetch(`/qrs/${QR_UUID}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: type,
                id: id
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = result.redirect;
        } else {
            alert(result.message || 'Assignment failed');
        }
    } catch (error) {
        console.error('Assignment failed:', error);
        alert('Failed to assign QR code');
    }
}

async function showCreateModal() {
    const type = document.getElementById('assignmentType').value;
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const modalId = `create${capitalizedType}Modal`;
    
    if (type === 'item') {
        try {
            // Remove the api.progs4u.com:3001 part and use relative paths
            const [roomsResp, storagesResp, containersResp] = await Promise.all([
                fetch('/api/locations/rooms'),
                fetch('/api/locations/storages'),
                fetch('/api/locations/containers')
            ]);

            // Add proper error handling and response parsing
            const rooms = await roomsResp.json();
            const storages = await storagesResp.json();
            const containers = await containersResp.json();
            
            // Check if we got arrays back
            if (Array.isArray(rooms)) populateSelect('room_id', rooms);
            if (Array.isArray(storages)) populateSelect('storage_id', storages);
            if (Array.isArray(containers)) populateSelect('container_id', containers);
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    }
    
    document.getElementById(modalId).classList.remove('hidden');
}

function populateSelect(selectName, items) {
    if (!Array.isArray(items)) {
        console.error(`Expected array for ${selectName}, got:`, items);
        return;
    }
    
    const select = document.querySelector(`select[name="${selectName}"]`);
    if (!select) return;
    
    select.innerHTML = `<option value="">-- Select --</option>`;
    items.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item.name}</option>`;
    });
}
/*
async function handleCreateForm(type, event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        // Use lowercase for the endpoint
        const response = await fetch(`/api/${type.toLowerCase()}s`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            closeModal(`create${type}Modal`);
            // Select the newly created item
            selectItem(result.data, type.toLowerCase());
        } else {
            throw new Error(result.message || 'Creation failed');
        }
    } catch (error) {
        console.error(`Failed to create ${type}:`, error);
        alert(`Failed to create ${type}`);
    }
}
*/

function updateItemLocationOptions(locationType, modalId) {
    const selectors = ['room', 'storage', 'container'].map(type => 
        document.querySelector(`#${modalId}-${type}Select`)
    );
    
    selectors.forEach(selector => {
        if (selector) {
            selector.classList.toggle('hidden', 
                selector.id !== `${modalId}-${locationType}Select`);
            
            // Clear other location inputs
            const input = selector.querySelector('select');
            if (input && selector.classList.contains('hidden')) {
                input.value = '';
            }
        }
    });
}


// Add these functions to existing file

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

async function handleCreateForm(type, event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'  // Add this header
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            closeModal(`create${type}Modal`);
            // Select the newly created item
            selectItem(result.data, type.toLowerCase());
            // Automatically submit the assignment form
            document.getElementById('assignmentForm').dispatchEvent(new Event('submit'));
        }
    } catch (error) {
        console.error(`Failed to create ${type}:`, error);
        alert(`Failed to create ${type}`);
    }
}



// Add event listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    ['Item', 'Container', 'Storage'].forEach(type => {
        const form = document.getElementById(`create${type}Form`);
        if (form) {
            form.addEventListener('submit', (e) => handleCreateForm(type, e));
        }
    });
});

