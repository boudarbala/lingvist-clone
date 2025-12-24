const API_KEY = '766bbd7a-3e65-482b-ae11-b643fe56fd70';
        const API_URL = 'https://www.dictionaryapi.com/api/v3/references/learners/json/';

        // In-memory user database (simulating SQLite)
        let users = {};
        let currentUser = null;

        // Check if user is already logged in
        if (localStorage.getItem('currentUser')) {
            currentUser = localStorage.getItem('currentUser');
            showDictionarySection();
        }

        function showMessage(text, type) {
            const message = document.getElementById('message');
            message.textContent = text;
            message.className = `message ${type}`;
            message.style.display = 'block';
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);
        }

        function showLogin() {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        }

        function showRegister() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }

        function register() {
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerPasswordConfirm').value;

            if (!username || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }

            if (users[username]) {
                showMessage('Username already exists', 'error');
                return;
            }

            // Store user (in real app, this would be in SQLite)
            users[username] = { password: password, searches: [] };
            localStorage.setItem('users', JSON.stringify(users));

            showMessage('Registration successful! Please login.', 'success');
            showLogin();

            // Clear form
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerPasswordConfirm').value = '';
        }

        function login() {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            // Load users from localStorage
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                users = JSON.parse(storedUsers);
            }

            if (!users[username]) {
                showMessage('Username not found', 'error');
                return;
            }

            if (users[username].password !== password) {
                showMessage('Incorrect password', 'error');
                return;
            }

            currentUser = username;
            localStorage.setItem('currentUser', username);
            showDictionarySection();
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authSection').classList.add('active');
            document.getElementById('dictionarySection').classList.remove('active');
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }

        function showDictionarySection() {
            document.getElementById('authSection').classList.remove('active');
            document.getElementById('dictionarySection').classList.add('active');
            document.getElementById('userInfo').textContent = `Welcome, ${currentUser}! 👋`;
            renderSearchHistory();
        }

        async function lookupWord(wordFromHistory) {
            const wordToLookup = wordFromHistory || document.getElementById('wordInput').value.trim().toLowerCase();

            if (!wordToLookup) {
                alert('Please enter a word to look up');
                return;
            }

            const loading = document.getElementById('loading');
            const resultDiv = document.getElementById('definitionResult');

            loading.style.display = 'block';
            resultDiv.style.display = 'none';

            try {
                const response = await fetch(`${API_URL}${wordToLookup}?key=${API_KEY}`);
                const data = await response.json();

                loading.style.display = 'none';

                if (!Array.isArray(data) || data.length === 0) {
                    resultDiv.innerHTML = '<p style="color: #721c24;">No definition found for this word.</p>';
                    resultDiv.style.display = 'block';
                    return;
                }

                // Check if we got suggestions instead of definitions
                if (typeof data[0] === 'string') {
                    resultDiv.innerHTML = `
                        <h3>Did you mean:</h3>
                        <p>${data.slice(0, 5).join(', ')}?</p>
                    `;
                    resultDiv.style.display = 'block';
                    return;
                }

                displayDefinitions(data);

                // Save search to user history
                saveSearch(wordToLookup);

            } catch (error) {
                loading.style.display = 'none';
                resultDiv.innerHTML = '<p style="color: #721c24;">Error fetching definition. Please try again.</p>';
                resultDiv.style.display = 'block';
                console.error('Error:', error);
            }
        }

        function displayDefinitions(data) {
            const resultDiv = document.getElementById('definitionResult');
            let html = '<h3>Definitions:</h3>';

            // Get first 3 entries
            const entries = data.slice(0, 3);

            entries.forEach((entry, index) => {
                if (entry.hwi && entry.hwi.hw && entry.fl) {
                    html += `<div class="definition-item">`;
                    html += `<div class="word-header">${entry.hwi.hw.replace(/\*/g, '')}</div>`;
                    html += `<div class="part-of-speech">${entry.fl}</div>`;

                    if (entry.shortdef && entry.shortdef.length > 0) {
                        entry.shortdef.forEach((def, i) => {
                            html += `<div class="definition-text"><strong>${i + 1}.</strong> ${def}</div>`;
                        });
                    }

                    // Add example if available
                    if (entry.def && entry.def[0] && entry.def[0].sseq) {
                        const examples = extractExamples(entry.def[0].sseq);
                        if (examples.length > 0) {
                            html += `<div class="example">"${examples[0]}"</div>`;
                        }
                    }

                    html += `</div>`;
                }
            });

            resultDiv.innerHTML = html;
            resultDiv.style.display = 'block';
        }

        function extractExamples(sseq) {
            const examples = [];
            sseq.forEach(sense => {
                sense.forEach(item => {
                    if (item[1] && item[1].dt) {
                        item[1].dt.forEach(dt => {
                            if (dt[0] === 'vis' && dt[1]) {
                                dt[1].forEach(vis => {
                                    if (vis.t) {
                                        examples.push(vis.t.replace(/{it}/g, '').replace(/{\/it}/g, ''));
                                    }
                                });
                            }
                        });
                    }
                });
            });
            return examples;
        }

        function saveSearch(word) {
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                users = JSON.parse(storedUsers);
                if (users[currentUser]) {
                    if (!users[currentUser].searches) {
                        users[currentUser].searches = [];
                    }
                    // Add to the beginning of the array to show the most recent search first
                    users[currentUser].searches.unshift({
                        word: word,
                        date: new Date().toISOString()
                    });
                    // Keep the history to a reasonable size
                    if (users[currentUser].searches.length > 10) {
                        users[currentUser].searches.pop();
                    }
                    localStorage.setItem('users', JSON.stringify(users));
                    renderSearchHistory();
                }
            }
        }

        function renderSearchHistory() {
            const historyList = document.getElementById('historyList');
            const searchHistory = document.getElementById('searchHistory');
            historyList.innerHTML = '';
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                users = JSON.parse(storedUsers);
                if (users[currentUser] && users[currentUser].searches && users[currentUser].searches.length > 0) {
                    searchHistory.style.display = 'block';
                    users[currentUser].searches.forEach(search => {
                        const li = document.createElement('li');
                        li.textContent = search.word;
                        li.onclick = () => {
                            document.getElementById('wordInput').value = search.word;
                            lookupWord(search.word);
                        };
                        historyList.appendChild(li);
                    });
                } else {
                    searchHistory.style.display = 'none';
                }
            }
        }

        // Allow Enter key to submit
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.getElementById('authSection').classList.contains('active')) {
                    if (document.getElementById('loginForm').style.display !== 'none') {
                        login();
                    } else {
                        register();
                    }
                } else {
                    lookupWord();
                }
            }
        });