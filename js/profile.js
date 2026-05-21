import { supabase } from './supabase.js'

const userEmail = document.getElementById('userEmail')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const profileUsername = document.getElementById('profileUsername')
const profileBio = document.getElementById('profileBio')
const editProfileBtn = document.getElementById('editProfileBtn')
const editProfileForm = document.getElementById('editProfileForm')
const editUsername = document.getElementById('editUsername')
const editBio = document.getElementById('editBio')
const saveProfileBtn = document.getElementById('saveProfileBtn')
const cancelProfileBtn = document.getElementById('cancelProfileBtn')
const postsByUser = document.getElementById('postsByUser')
const userArticles = document.getElementById('userArticles')

let currentUser = null
let profileId = new URLSearchParams(window.location.search).get('id')

init()

async function init() {
    await checkUser()
    await loadProfile()
    await loadUserArticles()
}

supabase.auth.onAuthStateChange(() => {
    checkUser()
    loadProfile()
})

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
    } else {
        userEmail.textContent = ''
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
}

async function loadProfile() {
    if (!profileId && currentUser) profileId = currentUser.id
    
    if (!profileId) {
        profileUsername.textContent = 'No profile found'
        return
    }
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
    
    if (error || !profile) {
        profileUsername.textContent = 'User not found'
        return
    }
    
    profileUsername.textContent = profile.username || 'Anonymous'
    profileBio.textContent = profile.bio || 'No bio yet.'
    postsByUser.textContent = profile.username || 'this user'
    
    if (currentUser && currentUser.id === profileId) {
        editProfileBtn.classList.remove('hidden')
        editUsername.value = profile.username || ''
        editBio.value = profile.bio || ''
    }
}

async function loadUserArticles() {
    if (!profileId) return
    
    const { data: articles, error } = await supabase
        .from('articles')
        .select(`id, title, content, created_at`)
        .eq('author_id', profileId)
        .order('created_at', { ascending: false })
    
    if (error) {
        userArticles.innerHTML = `Error: ${error.message}`
        return
    }
    
    if (articles.length === 0) {
        userArticles.innerHTML = '<p>No posts yet.</p>'
        return
    }
    
    userArticles.innerHTML = articles.map(article => `
        <div class="article">
            <h3><a href="./index.html#${article.id}">${article.title}</a></h3>
            <p>${article.content.replace(/\n/g, '<br>')}</p>
            <div class="meta">Posted ${new Date(article.created_at).toLocaleString()}</div>
        </div>
    `).join('')
}

editProfileBtn.onclick = () => {
    editProfileForm.classList.remove('hidden')
    editProfileBtn.classList.add('hidden')
}

cancelProfileBtn.onclick = () => {
    editProfileForm.classList.add('hidden')
    editProfileBtn.classList.remove('hidden')
}

saveProfileBtn.onclick = async () => {
    const { error } = await supabase
        .from('profiles')
        .update({ 
            username: editUsername.value.trim(), 
            bio: editBio.value.trim() 
        })
        .eq('id', currentUser.id)
    
    if (error) {
        alert(error.message)
    } else {
        editProfileForm.classList.add('hidden')
        editProfileBtn.classList.remove('hidden')
        loadProfile()
    }
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()
