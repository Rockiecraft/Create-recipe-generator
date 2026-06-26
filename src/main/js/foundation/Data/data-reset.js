function openResetConfirmationModal() {
    const targetModal = document.getElementById('resetConfirmationModal');
    if (targetModal) {
        targetModal.style.display = 'flex';
    }
}

function closeResetConfirmationModal() {
    const targetModal = document.getElementById('resetConfirmationModal');
    if (targetModal) {
        targetModal.style.display = 'none';
    }
}

function executeMasterApplicationDataReset() {
    try {
        
        const eyeSaverCurtain = document.createElement('div');
        eyeSaverCurtain.style.setProperty('position', 'fixed', 'important');
        eyeSaverCurtain.style.setProperty('top', '0', 'important');
        eyeSaverCurtain.style.setProperty('left', '0', 'important');
        eyeSaverCurtain.style.setProperty('right', '0', 'important');
        eyeSaverCurtain.style.setProperty('bottom', '0', 'important');
        eyeSaverCurtain.style.setProperty('width', '100vw', 'important');
        eyeSaverCurtain.style.setProperty('height', '100vh', 'important');
        eyeSaverCurtain.style.setProperty('background', '#111217', 'important'); 
        eyeSaverCurtain.style.setProperty('zIndex', '999999', 'important');

        
        eyeSaverCurtain.style.setProperty('transform', 'scale(1.17647)', 'important');
        eyeSaverCurtain.style.setProperty('transform-origin', 'top left', 'important');

        document.body.appendChild(eyeSaverCurtain);

        window.cachedConditionWrapperTemplate = null;
        window.isParsingRecipe = false;

        
        localStorage.clear();

        
        setTimeout(() => {
            window.location.reload();
        }, 50);
    } catch (faultErr) {
        console.error('Master database reset pipeline interrupted: ', faultErr);
    }
}
