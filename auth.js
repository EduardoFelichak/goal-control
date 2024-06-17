document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            login();
        });
    }

    if (window.location.pathname.includes('home.html') && !localStorage.getItem('loggedIn')) {
        window.location.href = 'login.html';
    }
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const db = new PouchDB(dbName);

    db.find({
        selector: {
            type: 'user',
            email: email,
            senha: password
        }
    }).then(result => {
        if (result.docs.length > 0) {
            localStorage.setItem('loggedIn', 'true');
            window.location.href = 'home.html';
        } else {
            alert("Credenciais inválidas!");
        }
    }).catch(err => {
        console.error('Erro ao buscar usuário:', err);
        alert("Erro ao realizar login.");
    });
}

function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
}
