const remoteCouchDBUrl = 'http://localhost:5984/_utils';

function syncDatabase(dbName) {
    const localDB = new PouchDB(dbName);
    const remoteDB = new PouchDB(`${remoteCouchDBUrl}/${dbName}`);

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
        data._id = new Date().toISOString();

        db.put(data).then(() => {
            alert('Cadastro realizado com sucesso!');
            form.reset();
        }).catch(err => {
            console.error(err);
            alert('Erro ao realizar o cadastro.');
        });
    });
}

function setupShowButton(buttonId, dbName) {
    const button = document.getElementById(buttonId);
    const db = new PouchDB(dbName);

    button.addEventListener('click', function () {
        db.allDocs({ include_docs: true, descending: true }).then(doc => {
            let items = doc.rows.map(row => {
                return JSON.stringify(row.doc, null, 2);
            }).join('\n');
            alert(items);
        }).catch(err => {
            console.error(err);
            alert('Erro ao buscar os cadastros.');
        });
    });
}

// Inicializa a sincronização e configura os formulários e botões quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('form[data-db]');
    forms.forEach(form => {
        const dbName = form.getAttribute('data-db');
        setupFormSubmission(form.id, dbName);
        syncDatabase(dbName);
    });

    const buttons = document.querySelectorAll('button[data-db]');
    buttons.forEach(button => {
        const dbName = button.getAttribute('data-db');
        setupShowButton(button.id, dbName);
    });
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
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('content').innerHTML = '<h1>Erro ao carregar a página</h1>';
        });
}