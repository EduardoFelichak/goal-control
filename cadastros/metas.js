document.addEventListener('DOMContentLoaded', function() {
    createViewIfNotExists().then(loadTags);

    const form = document.getElementById('goalForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const db = new PouchDB('appdata');
        const userId = localStorage.getItem('userId');
        const data = {
            _id: new Date().toISOString(),
            type: 'goal',
            goal: form.goal.value,
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            description: form.description.value,
            tag: form.tag.value,
            userId: userId
        };

        db.put(data).then(() => {
            alert('Meta cadastrada com sucesso!');
            window.location.href = 'home.html';
        }).catch(err => {
            console.error('Erro ao salvar meta:', err);
            alert('Falha ao cadastrar meta.');
        });
    });

    async function createViewIfNotExists() {
        const designDoc = {
            _id: '_design/tags',
            views: {
                by_type: {
                    map: "function(doc) { if (doc.type === 'tag') { emit(doc._id, doc); } }"
                }
            }
        };

        const db = new PouchDB('appdata');
        try {
            const result = await db.get('_design/tags');
            console.log('View already exists');
        } catch (err) {
            if (err.status === 404) {
                try {
                    await db.put(designDoc);
                    console.log('Design document created');
                } catch (err) {
                    console.error('Error creating design document:', err);
                }
            } else {
                console.error('Error checking design document:', err);
            }
        }
    }

    async function loadTags() {
        const userId = localStorage.getItem('userId');
        const db = new PouchDB('appdata');
        try {
            const result = await db.query('tags/by_type', { include_docs: true });

            const select = document.getElementById('tag');
            select.innerHTML = '';  // Clear existing options

            console.log("Data from CouchDB:", result);

            result.rows.forEach(row => {
                console.log("Processing row:", row.doc);
                if (row.doc.userId === userId) {
                    const option = document.createElement('option');
                    option.value = `${row.doc.icon} ${row.doc.name}`;
                    option.textContent = `${row.doc.icon} ${row.doc.name}`;
                    select.appendChild(option);
                }
            });

            if (select.options.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'Nenhuma tag encontrada';
                select.appendChild(option);
            }

        } catch (err) {
            console.error('Erro ao carregar tags:', err);
        }
    }
});
