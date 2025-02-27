function toggleItemModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden');
        // Reset form if closing
        if (!modal.classList.contains('hidden')) {
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }
}

function updateItemLocationOptions(locationType, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const selectors = ['room', 'storage', 'container'].map(type => 
        modal.querySelector(`#${modalId}-${type}Select`)
    );
    
    selectors.forEach(selector => {
        if (selector) {
            selector.classList.toggle('hidden', 
                selector.id !== `${modalId}-${locationType}Select`);
        }
    });
}