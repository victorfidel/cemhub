import { supabase } from './supabase.js'

const userEmail = document.getElementById('userEmail')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const postForm = document.getElementById('postForm')
const postBtn = document.getElementById('postBtn')
const title = document.getElementById('title')
const content = document.getElementById('content')
const msg = document.getElementById('msg')
const articlesDiv = document.getElementById('articles')

let currentUser = null

// Check auth + load articles on page load
checkUser()
loadArticles()

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
    checkUser()
})

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
        postForm.classList.remove('hidden')
    } else {
        userEmail.textContent = ''
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
        postForm.classList.add('hidden')
    }
}

// Post new article
postBtn.onclick = async () => {
    if (!currentUser) return
    if (!title.value || !content.value) {
        msg.style.color = 'red'
        msg.textContent = 'Title and content required'
        return
    }
    
    msg.textContent = 'Publishing...'
    const { error } = await supabase.from('articles').insert({
        title: title.value,
        content: content.value,
        author_id: currentUser.id
    })
    
    if (error) {
        msg.style.color = 'red'
        msg.textContent = error.message
    } else {
        msg.style.color = 'green'
        msg.textContent = 'Published!'
        title.value = ''
        content.value = ''
        loadArticles() // Refresh feed
        setTimeout(() => msg.textContent = '', 2000)
    }
}

// Load all articles
async function loadArticles() {
    articlesDiv.innerHTML = 'Loading...'
    
    const { data, error } = await supabase
        .from('articles')
        .select('id, title, content, created_at, author_id')
        .order('created_at', { ascending: false })
    
    if (error) {
        articlesDiv.innerHTML = `Error: ${error.message}`
        return
    }
    
    if (data.length === 0) {
        articlesDiv.innerHTML = '<p>No articles yet. Be the first to post!</p>'
        return
    }
    
    articlesDiv.innerHTML = data.map(article => `
        <div class="article">
            <h3>${article.title}</h3>
            <p>${article.content.replace(/\n/g, '<br>')}</p>
            <div class="meta">Posted ${new Date(article.created_at).toLocaleString()}</div>
        </div>
    `).join('')
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()
