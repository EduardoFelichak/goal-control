const remoteCouchDBUrl = 'http://localhost:5984';
const dbName = 'appdata';

document.addEventListener('DOMContentLoaded', async function () {
    await createDatabaseIfNotExists(dbName);
    syncDatabase(dbName);
    setupFormSubmission('tagForm');
    setupFormSubmission('goalForm');
    loadTags();
    displayGoals();
});

async function createDatabaseIfNotExists(dbName) {
    try {
        const checkResponse = await fetch(`${remoteCouchDBUrl}/${dbName}`, {
            method: 'HEAD',
            headers: {
                'Authorization': 'Basic ' + btoa('admin:admin')
            }
        });

        if (checkResponse.ok) {
            console.log(`Database ${dbName} already exists.`);
        } else if (checkResponse.status === 404) {
            const createResponse = await fetch(`${remoteCouchDBUrl}/${dbName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Basic ' + btoa('admin:admin')
                }
            });

            if (createResponse.ok) {
                console.log(`Database ${dbName} created.`);
            } else {
                const error = await createResponse.json();
                console.error(`Error creating database ${dbName}:`, error);
            }
        } else {
            const error = await checkResponse.json();
            console.error(`Error checking database ${dbName}:`, error);
        }
    } catch (error) {
        console.error('Error connecting to CouchDB:', error);
    }
}

function syncDatabase(dbName) {
    const localDB = new PouchDB(dbName);
    const remoteDB = new PouchDB(`${remoteCouchDBUrl}/${dbName}`, {
        auth: { username: 'admin', password: 'admin' }
    });
    localDB.sync(remoteDB, { live: true, retry: true })
        .on('error', err => console.error(`Sync error on ${dbName}`, err));
}

function setupFormSubmission(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const db = new PouchDB(dbName);
        const userId = localStorage.getItem('userId');
        const data = { _id: new Date().toISOString(), type: form.getAttribute('data-type'), userId: userId };
        new FormData(form).forEach((value, key) => { data[key] = value; });
        try {
            await db.put(data);
            alert('Cadastro realizado com sucesso!');
            form.reset();
        } catch (err) {
            console.error('Erro ao realizar o cadastro:', err);
            alert('Erro ao realizar o cadastro.');
        }
    });
}

function loadTags() {
    const db = new PouchDB(dbName);
    const select = document.getElementById('tag');
    if (!select) return;

    db.allDocs({ include_docs: true }).then(result => {
        result.rows.forEach(row => {
            if (row.doc.type === 'tag') {
                const option = document.createElement('option');
                option.value = row.doc._id;
                option.textContent = `${row.doc.icon} ${row.doc.name}`;
                select.appendChild(option);
            }
        });
    }).catch(err => {
        console.error('Erro ao carregar as tags:', err);
        alert('Erro ao carregar as tags.');
    });
}

function displayGoals() {
    const db = new PouchDB(dbName);
    const container = document.getElementById('goalList');
    const userId = localStorage.getItem('userId');
    if (!container || !userId) return;

    db.find({
        selector: { type: 'goal', userId: userId }
    }).then(result => {
        container.innerHTML = '';
        if (result.docs.length === 0) {
            container.innerHTML = '<div class="empty-message">Ainda não foram incluídas metas!</div>';
        } else {
            result.docs.forEach(item => {
                const div = document.createElement('div');
                div.className = 'record-item';
                div.innerHTML = `
                    <div>
                        <strong>${item.goal}</strong> - ${item.startDate} to ${item.endDate}
                        <p>${item.description}</p>
                        <p>${item.tag}</p>
                    </div>
                    <div>
                        <button onclick='editRecord("${item._id}")'>Editar</button>
                        <button onclick='deleteRecord("${item._id}")'>Deletar</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    }).catch(err => {
        console.error('Erro ao buscar os cadastros:', err);
        alert('Erro ao buscar os cadastros.');
    });
}

function editRecord(id) {
    const db = new PouchDB(dbName);
    db.get(id).then(doc => {
        for (let key in doc) {
            if (doc.hasOwnProperty(key) && document.getElementById(key)) {
                document.getElementById(key).value = doc[key];
            }
        }
        document.getElementById('_id').value = doc._id;
    }).catch(err => {
        console.error('Erro ao buscar o registro:', err);
        alert('Erro ao buscar o registro.');
    });
}

function deleteRecord(id) {
    const db = new PouchDB(dbName);
    db.get(id).then(doc => {
        return db.remove(doc);
    }).then(() => {
        alert('Registro deletado com sucesso!');
        displayGoals();
    }).catch(err => {
        console.error('Erro ao deletar o registro:', err);
        alert('Erro ao deletar o registro.');
    });
}

function loadContent(page) {
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar a página: ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('content').innerHTML = data;
            document.querySelectorAll('form[data-db]').forEach(form => {
                setupFormSubmission(form.id);
                syncDatabase(dbName);
            });
            if (page === 'cadastrosMetas.html') {
                loadTags();
            }
        })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('content').innerHTML = '<h1>Erro ao carregar a página</h1>';
    });
}
