const remoteCouchDBUrl = 'http://localhost:5984'; 

async function createDatabaseIfNotExists(dbName) {
    try {
        const response = await fetch(`${remoteCouchDBUrl}/${dbName}`, {
            method: 'PUT'
        });
        if (response.status === 201 || response.status === 412) {
            console.log(`Database ${dbName} exists or created.`);
        } else {
            console.error(`Error creating database ${dbName}:`, await response.text());
        }
    } catch (error) {
        console.error('Error connecting to CouchDB:', error);
    }
}

function syncDatabase(dbName) {
    const localDB = new PouchDB(dbName);
    const remoteDB = new PouchDB(`${remoteCouchDBUrl}/${dbName}`, {
        auth: {
            username: 'admin', 
            password: 'admin'
        }
    });

    localDB.sync(remoteDB, {
        live: true,
        retry: true
    }).on('change', function (info) {
        console.log(`sync change on ${dbName}`, info);
    }).on('paused', function (err) {
        console.log(`sync paused on ${dbName}`, err);
    }).on('active', function () {
        console.log(`sync active on ${dbName}`);
    }).on('denied', function (err) {
        console.error(`sync denied on ${dbName}`, err);
    }).on('complete', function (info) {
        console.log(`sync complete on ${dbName}`, info);
    }).on('error', function (err) {
        console.error(`sync error on ${dbName}`, err);
    });
}

function setupFormSubmission(formId, dbName) {
    const form = document.getElementById(formId);
    const db = new PouchDB(dbName);

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        data._id = formData.get('_id') || new Date().toISOString();

        db.put(data).then(() => {
            alert('Cadastro realizado com sucesso!');
            form.reset();
            if (dbName === 'goals') {
                displayGoals();
            }
        }).catch(err => {
            console.error(err);
            alert('Erro ao realizar o cadastro.');
        });
    });
}

function displayGoals() {
    const db = new PouchDB('goals');
    const container = document.getElementById('goalList');
    if (container) {
        container.innerHTML = '';

        db.allDocs({ include_docs: true, descending: true }).then(doc => {
            doc.rows.forEach(row => {
                const item = row.doc;
                const div = document.createElement('div');
                div.className = 'record-item';

                div.innerHTML = `
                    <div>
                        <strong>${item.goal}</strong> - ${item.startDate} to ${item.endDate}
                        <p>${item.description}</p>
                        <p>${item.tag}</p>
                    </div>
                    <div>
                        <button onclick='editRecord("goals", "${item._id}")'>Editar</button>
                        <button onclick='deleteRecord("goals", "${item._id}")'>Deletar</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }).catch(err => {
            console.error(err);
            alert('Erro ao buscar os cadastros.');
        });
    }
}

function editRecord(dbName, id) {
    const db = new PouchDB(dbName);
    db.get(id).then(doc => {
        for (let key in doc) {
            if (doc.hasOwnProperty(key) && document.getElementById(key)) {
                document.getElementById(key).value = doc[key];
            }
        }
        document.getElementById('_id').value = doc._id;
    }).catch(err => {
        console.error(err);
        alert('Erro ao buscar o registro.');
    });
}

function deleteRecord(dbName, id) {
    const db = new PouchDB(dbName);
    db.get(id).then(doc => {
        return db.remove(doc);
    }).then(() => {
        alert('Registro deletado com sucesso!');
        if (dbName === 'goals') {
            displayGoals();
        }
    }).catch(err => {
        console.error(err);
        alert('Erro ao deletar o registro.');
    });
}

function loadTags() {
    const db = new PouchDB('tags');
    const tagSelect = document.getElementById('tag');
    if (tagSelect) {
        db.allDocs({ include_docs: true }).then(doc => {
            doc.rows.forEach(row => {
                const option = document.createElement('option');
                option.value = `${row.doc.icon} ${row.doc.name}`;
                option.textContent = `${row.doc.icon} ${row.doc.name}`;
                tagSelect.appendChild(option);
            });
        }).catch(err => {
            console.error(err);
            alert('Erro ao carregar as tags.');
        });
    }
}

function displayRecords(dbName) {
    const db = new PouchDB(dbName);
    const container = document.getElementById(`${dbName}List`);
    if (container) {
        container.innerHTML = '';

        db.allDocs({ include_docs: true, descending: true }).then(doc => {
            doc.rows.forEach(row => {
                const item = row.doc;
                const div = document.createElement('div');
                div.className = 'record-item';

                div.innerHTML = `
                    <div>
                        <strong>${item.name}</strong>
                        <p>${item.description}</p>
                    </div>
                    <div>
                        <button onclick='editRecord("${dbName}", "${item._id}")'>Editar</button>
                        <button onclick='deleteRecord("${dbName}", "${item._id}")'>Deletar</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }).catch(err => {
            console.error(err);
            alert('Erro ao buscar os cadastros.');
        });
    }
}

// Inicializa a sincronização e configura os formulários e botões quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', async function () {
    const forms = document.querySelectorAll('form[data-db]');
    for (let form of forms) {
        const dbName = form.getAttribute('data-db');
        await createDatabaseIfNotExists(dbName);
        setupFormSubmission(form.id, dbName);
        syncDatabase(dbName);
    }

    const buttons = document.querySelectorAll('button[data-db]');
    buttons.forEach(button => {
        const dbName = button.getAttribute('data-db');
        setupShowButton(button.id, dbName);
    });

    loadTags();
    displayGoals();
});

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

            // Configurar novamente os formulários e carregar tags se necessário
            const forms = document.querySelectorAll('form[data-db]');
            forms.forEach(form => {
                const dbName = form.getAttribute('data-db');
                setupFormSubmission(form.id, dbName);
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