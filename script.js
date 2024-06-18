const remoteCouchDBUrl = 'http://localhost:5984';
const dbName = 'appdata';

document.addEventListener('DOMContentLoaded', function() {
    createDatabaseIfNotExists();
    syncDatabase();
});

async function createDatabaseIfNotExists() {
    const response = await fetch(`${remoteCouchDBUrl}/${dbName}`, { method: 'HEAD' });
    if (response.status === 404) {
        await fetch(`${remoteCouchDBUrl}/${dbName}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Basic ' + btoa('admin:admin') }
        });
    }
}

function syncDatabase() {
    const localDB = new PouchDB(dbName);
    const remoteDB = new PouchDB(`${remoteCouchDBUrl}/${dbName}`, {
        auth: { username: 'admin', password: 'admin' }
    });
    localDB.sync(remoteDB, { live: true, retry: true });
}

function loadContent(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = html;
            document.querySelectorAll('form[data-db]').forEach(form => {
                setupFormSubmission(form.id);
            });
        })
        .catch(error => {
            console.error('Failed to load content:', error);
            document.getElementById('content').innerHTML = '<h1>Erro ao carregar a página</h1>';
        });
}
