const dbName = 'appdata';

document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registerUser();
        });
    }
});

function registerUser() {
    const db = new PouchDB(dbName);
    const data = {
        _id: new Date().toISOString(),
        type: 'user',
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        endereco: document.getElementById('endereco').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value,
        cep: document.getElementById('cep').value,
        telefone: document.getElementById('telefone').value
    };

    db.put(data).then(() => {
        alert('Usuário cadastrado com sucesso!');
        window.location.href = 'login.html';
    }).catch(err => {
        console.error('Erro ao cadastrar usuário:', err);
        alert('Erro ao cadastrar usuário.');
    });
}
