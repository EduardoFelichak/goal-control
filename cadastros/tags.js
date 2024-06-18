document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tagForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const db = new PouchDB('appdata');
        const userId = localStorage.getItem('userId');
        const data = {
            _id: new Date().toISOString(),
            type: 'tag',
            icon: form.icon.value,
            name: form.name.value,
            description: form.description.value,
            userId: userId
        };

        db.put(data).then(() => {
            alert('Tag cadastrada com sucesso!');
            window.location.href = 'home.html';
        }).catch(err => {
            console.error('Erro ao salvar tag:', err);
            alert('Falha ao cadastrar tag.');
        });
    });
});
