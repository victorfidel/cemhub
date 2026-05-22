import { supabase } from './supabase.js'

const params = new URLSearchParams(window.location.search)
const profileId = params.get('id')

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
let profileUser = null

init()

supabase.auth.onAuthStateChange(() => init())

async function init() {
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
    
    if (!profileId) {
        profileUsername.textContent = 'No user specified'
        return
    }
    
    await loadProfile()
    await loadUserArticles()
}

async function loadProfile() {
    const { data: profile, error } = await supabase
   .from('profiles')
   .select('id, username, bio, avatar_url')
   .eq('id', profileId)
   .single()
    
    if (error) {
        profileUsername.textContent = `Error: ${error.message}`
        return
    }
    
    if (!profile) {
        profileUsername.textContent = 'User not found'
        return
    }
    
    profileUser = profile
    profileUsername.textContent = profile.username || 'Anonymous'
    profileBio.textContent = profile.bio || 'No bio yet'
    postsByUser.textContent = profile.username || 'Anonymous'
    
    const isOwner = currentUser && currentUser.id === profileId
    if (isOwner) {
        editProfileBtn.classList.remove('hidden')
        editProfileBtn.onclick = () => toggleEdit(true)
        saveProfileBtn.onclick = saveProfile
        cancelProfileBtn.onclick = () => toggleEdit(false)
    } else {
        editProfileBtn.classList.add('hidden')
    }
}

function toggleEdit(editing) {
    editProfileForm.classList.toggle('hidden', !editing)
    editProfileBtn.classList.toggle('hidden', editing)
    if (editing) {
        editUsername.value = profileUser.username || ''
        editBio.value = profileUser.bio || ''
    }
}

async function saveProfile() {
    const username = editUsername.value.trim()
    const bio = editBio.value.trim()
    
    if (!username) {
        alert('Username required')
        return
    }
    
    saveProfileBtn.textContent = 'Saving...'
    
    const { error } = await supabase
   .from('profiles')
   .update({ username, bio })
   .eq('id', currentUser.id)
    
    if (error) {
        alert(error.message)
        saveProfileBtn.textContent = 'Save'
    } else {
        saveProfileBtn.textContent = 'Save'
        toggleEdit(false)
        loadProfile()
    }
}

async function loadUserArticles() {
    userArticles.innerHTML = 'Loading posts...'
    
    const { data: articles, error } = await supabase
   .from('articles')
   .select(`
            id, title, content, created_at,
            profiles ( username )
        `)
   .eq('author_id', profileId)
   .order('created_at', { ascending: false })
    
    if (error) {
        userArticles.innerHTML = `Error: ${error.message}`
        return
    }
    
    if (articles.length === 0) {
        userArticles.innerHTML = '<p>No posts yet</p>'
        return
    }
    
    userArticles.innerHTML = articles.map(article => `
        <div class="article">
            <h3><a href="./index.html">${article.title}</a></h3>
            <p>${article.content.replace(/\n/g, '<br>')}</p>
            <div class="meta">Posted ${new Date(article.created_at).toLocaleString()}</div>
        </div>
    `).join('')
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()
