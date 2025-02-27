function toggleStorageModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.toggle('hidden');
    }
  }