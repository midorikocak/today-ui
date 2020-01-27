import {config} from "./config.js";

class App {

    constructor() {
        // Check if logged
        // If not logged redirect to login Page
        // If in login page, stop redirection

        this.apiUrl = config.api.url;

        this.router();


        if (this.auth === '' && window.location.pathname !== '/register.html') {
            this.redirect('/login.html')
        } else {
            this.logged();
        }

        Date.prototype.toDateInputValue = (function () {
            let local = new Date(this);
            local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
            return local.toJSON().slice(0, 10);
        });
    }

    setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

    // getters and setters

    get auth() {
        let authCookie = this.getCookie('auth');
        if (authCookie) {
            let authData = JSON.parse(authCookie);
            return authData.Authorization;
        }
        return '';
    }

    set auth(token) {
        this.setCookie('auth', JSON.stringify({Authorization: token}), 1);
    }


    // helpers

    init() {
        this.render()
    }

    redirect(uri) {
        if (window.location.pathname !== uri) {
            window.location.pathname = uri;
        }
    }

    request(method, url, data = null, auth = null) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest()
            xhr.open(method, url, true)
            xhr.setRequestHeader('Content-Type', 'application/json');

            if (auth) {
                xhr.setRequestHeader('Authorization', 'Basic ' + auth);
            }


            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    return resolve(JSON.parse(xhr.responseText || '{}'))
                } else {
                    return reject(new Error(`Request failed with status ${xhr.status}`))
                }
            }
            if (data) {
                xhr.send(JSON.stringify(data))
            } else {
                xhr.send()
            }
        })
    }

    async router() {

        // Add these routes

        // add

        // edit

        // delete

        // view

        // index
        let urlParams = new URLSearchParams(window.location.search);

        switch (window.location.pathname) {
            case '/index.html':
                this.index();
                break;
            case '/login.html':
                this.login();
                break;
            case '/add.html':
                this.add();
                break;
            case '/settings.html':
                this.settings();
                break;
            case '/register.html':
                this.register();
                break;
            case '/edit.html':
                if (urlParams.has('id')) {
                    let id = urlParams.get('id');
                    this.edit(id);
                }
                break;
            case '/view.html':
                if (urlParams.has('id')) {
                    let id = urlParams.get('id');
                    this.view(id);
                }
                break;
            default:
                this.index();
        }
    }

    async list(uri) {
        this.redirect('/index.html')
        try {
            let entries = await this.request('GET', uri, null, this.auth);

            let fragment = document.createDocumentFragment()

            let el = document.getElementById('entries')

            if (Array.isArray(entries) && entries.length > 0) {
                el.classList.remove('empty');

                for (let entry of entries) {
                    entry.words =
                        entry.today.split(' ').length +
                        entry.yesterday.split(' ').length +
                        entry.blocker.split(' ').length;

                    fragment.appendChild(this.createEntryListElement(
                        entry.id,
                        entry.created_at,
                        entry.words,
                        entry.yesterday,
                        entry.today,
                        entry.blocker
                        ))
                }

                el.innerHTML = "";
                while (el.firstChild) {
                    el.removeChild(el.firstChild) // empty the <div id="meals" />
                }
                el.appendChild(fragment);

                let deleteLinks = document.querySelectorAll('.delete-link').forEach(
                    (el) => {
                        el.addEventListener('click', (e) => {
                            this.delete(e.target.dataset.id);
                        })
                    })

            } else {
                el.classList.add('empty');
                el.innerHTML = `
                 <section class="empty">
                     <img alt="Journal with pen illustration" src="/img/journal-with-pen.svg" />
                     <h2>Entries will appear here</h2>
                     <p>When you add some journal entries for your productive day, they are going to be seen here. Go create some!</p>
                     <button onclick="window.location.href='/add.html'"><i class="fas fa-plus"></i> Create</button>
                 </section>`;

            }

        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }

    async index() {
        this.list(this.apiUrl + '/entries')
    }

    async today() {
        this.list(this.apiUrl + '/today')
    }

    async yesterday() {
        this.list(this.apiUrl + '/yesterday')
    }

    async week() {
        this.list(this.apiUrl + '/week')
    }

    async month() {
        this.list(this.apiUrl + '/month')
    }

    async search(term) {
        this.list(this.apiUrl + '/search/' + term);
    }

    formatDate(date) {
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }

    async view(id) {

        let uri = this.apiUrl + '/entries/' + id;
        try {
            let entry = await this.request('GET', uri, null, this.auth);

            let today = document.getElementById('todayText');
            let yesterday = document.getElementById('yesterdayText');
            let blocker = document.getElementById('blockersText');
            let date = document.getElementById('date');
            let words = document.getElementById('wordsBadge');

            entry.words =
                entry.today.split(' ').length +
                entry.yesterday.split(' ').length +
                entry.blocker.split(' ').length;

            today.innerHTML = entry.today;
            yesterday.innerHTML = entry.yesterday;
            blocker.innerHTML = entry.blocker;
            date.innerHTML = new Date(entry.createdAt).toDateInputValue();
            words.innerHTML = entry.words + ' words';

            date.dateTime = entry.createdAt;

            date.innerHTML = this.formatDate(new Date(entry.createdAt));
        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }


    async edit(id) {

        let uri = this.apiUrl + '/entries/' + id;
        try {
            let entry = await this.request('GET', uri, null, this.auth);

            let todayInput = document.getElementById('todayInput');
            let yesterdayInput = document.getElementById('yesterdayInput');
            let blockersInput = document.getElementById('blockersInput');
            let dateInput = document.getElementById('dateInput');

            todayInput.value = entry.today;
            yesterdayInput.value = entry.yesterday;
            blockersInput.value = entry.blocker;
            dateInput.value = new Date(entry.createdAt).toDateInputValue();

            document.getElementById('edit').addEventListener('click',
                async (event) => {
                    event.preventDefault();
                    try {

                        let data = {
                            today: todayInput.value,
                            yesterday: yesterdayInput.value,
                            blocker: blockersInput.value,
                            createdAt: dateInput.value
                        };

                        const entry = await this.request('PUT', uri, data, this.auth)
                        window.location.href = '/edit.html?id=' + id;
                    } catch (err) {
                        alert(`Error: ${err.message}`)
                    }
                })
        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }

    async settings() {

        let uri = this.apiUrl + '/settings/';
        try {
            let settings = await this.request('GET', uri, null, this.auth);

            let usernameInput = document.getElementById('usernameInput');
            let passwordInput = document.getElementById('passwordInput');
            let passwordCheckInput = document.getElementById('passwordCheckInput');
            let emailInput = document.getElementById('emailInput');

            usernameInput.value = settings.username;
            emailInput.value = settings.email;

            document.getElementById('settingsButton').addEventListener('click',
                async (event) => {
                    event.preventDefault();
                    try {

                        let data = {
                            username: usernameInput.value,
                            password: passwordInput.value,
                            passwordCheck: passwordCheckInput.value,
                            email: emailInput.value
                        };

                        const settings = await this.request('PUT', uri, data, this.auth)
                        window.location.href = '/settings.html';
                    } catch (err) {
                        alert(`Error: ${err.message}`)
                    }
                })
        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }

    createEntryListElement(id, created_at, words, yesterday, today, blocker) {
        let el = document.createElement('div');
        let dateTimeParts= created_at.split(/[- :]/); // regular expression split that creates array with: year, month, day, hour, minutes, seconds values
        dateTimeParts[1]--; // monthIndex begins with 0 for January and ends with 11 for December so we need to decrement by one

        let date = new Date(...dateTimeParts); // our Date object
        const month = date.toLocaleString('default', {month: 'short'});
        const day = date.toLocaleDateString('default', {weekday: 'long'});

        el.className = 'day card'
        el.innerHTML = `
                <div class="day-info">
                    <a href="/view.html?id=${id}"><h1> ${date.getDate()}   ${month}  ${date.getFullYear()} </h1></a>
                    <h2>${day}</h2>
                    <p class="badges">
                        <a href="#" class="badge">${words} words</a>
                    </p>
                </div>
                <div class="actions">
                    <a href="/edit.html?id=${id}">Edit</a>
                    <a class="delete-link" data-id="${id}" href="#">Delete</a>
                </div>
                <div>
                    <dl class="hide">
                        <dt>Id:</dt>
                        <dd>${id}</dd>
                        <dt>Created:</dt>
                        <dd>${created_at}</dd>
                    </dl>
                </div>
    `;

        return el
    }

    async delete(id) {
        let uri = this.apiUrl + '/entries/' + id;
        try {
            if (confirm('Are you sure?')) {
                let entry = await this.request('DELETE', uri, null, this.auth);
                this.index();
            }
        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }

    login() {
        document.getElementById('login').addEventListener('click',
            async (event) => {
                event.preventDefault();
                let email = document.getElementById('email').value;
                let password = document.getElementById('password').value;
                let data = {email: email, password: password};

                try {
                    this.auth = await this.request('POST', this.apiUrl + '/login', data);
                    this.redirect('/index.html');
                } catch (err) {
                    alert(`Error: ${err.message}`)
                }
            })
    }


    register() {

        let uri = this.apiUrl + '/register/';
        try {
            let usernameInput = document.getElementById('usernameInput');
            let passwordInput = document.getElementById('passwordInput');
            let passwordCheckInput = document.getElementById('passwordCheckInput');
            let emailInput = document.getElementById('emailInput');


            document.getElementById('registerButton').addEventListener('click',
                async (event) => {
                    event.preventDefault();
                    try {

                        let data = {
                            username: usernameInput.value,
                            password: passwordInput.value,
                            passwordCheck: passwordCheckInput.value,
                            email: emailInput.value
                        };


                        let response = await this.request('POST', uri, data);
                        alert('Successfully registered');
                        this.redirect('/login.html');
                    } catch (err) {
                        alert(`Error: ${err.message}`)
                    }
                })
        } catch (err) {
            alert(`Error: ${err.message}`)
        }
    }

    add() {
        document.getElementById('new').addEventListener('click',
            async (event) => {
                event.preventDefault();
                let today = document.getElementById('todayInput').value;
                let yesterday = document.getElementById('yesterdayInput').value;
                let blocker = document.getElementById('blockersInput').value;
                let data = {today: today, yesterday: yesterday, blocker: blocker};

                try {
                    const entry = await this.request('POST', this.apiUrl + '/entries', data, this.auth)
                    this.redirect('/index.html');
                } catch (err) {
                    alert(`Error: ${err.message}`)
                }
            })
    }

    logout() {
        this.auth = '';
        this.redirect('/login.html');
    }

    logged() {
        document.getElementById('menu-toggle').addEventListener('click', (event) => {
            event.preventDefault()
            var element = document.querySelector('.sidebar')
            element.classList.toggle("hide-mobile");
        });

        document.getElementById('logout').addEventListener('click', (event) => {
            event.preventDefault();
            this.logout()
        })

        document.getElementById('today').addEventListener('click', (event) => {
            event.preventDefault();
            this.today()
        })

        document.getElementById('settingsLink').addEventListener('click', (event) => {
            event.preventDefault();
            this.redirect('/settings.html');
        })

        document.getElementById('yesterday').addEventListener('click', (event) => {
            event.preventDefault();
            this.yesterday()
        })

        document.getElementById('week').addEventListener('click', (event) => {
            event.preventDefault();
            this.week()
        })

        document.getElementById('month').addEventListener('click', (event) => {
            event.preventDefault();
            this.month()
        })

        document.getElementById('search').addEventListener('change', (event) => {
            event.preventDefault();
            this.search(event.target.value);
        })
    }


    render() {

    }
}

var app = new App();
app.init();
