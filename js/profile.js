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
const profileHeader = document.getElementById('profileHeader')

let currentUser = null
let profileId = new URLSearchParams(window.location.search).get('id')

// Add debug box to page
const debugBox = document.createElement('div')
debugBox.style.cssText = 'background:#fffae6; padding:10px; margin:10px 0; font-size:12px; border:1px solid #ccc;'
profileHeader.before(debugBox)

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
    
    debugBox.innerHTML += `Logged in as: ${currentUser ? currentUser.email : 'null'}<br>`
    debugBox.innerHTML += `User ID: ${currentUser ? currentUser.id : 'null'}<br>`
    
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
    
    debugBox.innerHTML += `Profile ID from URL: ${new URLSearchParams(window.location.search).get('id') || 'none'}<br>`
    debugBox.innerHTML += `Final Profile ID used: ${profileId || 'none'}<br>`
    
    if (!profileId) {
        profileUsername.textContent = 'No profile ID'
        return
    }
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
    
    debugBox.innerHTML += `Profile query error: ${error ? error.message : 'none'}<br>`
    debugBox.innerHTML += `Profile found: ${profile ? 'yes' : 'no'}<br>`
    debugBox.innerHTML += `IDs match: ${currentUser && profileId === currentUser.id ? 'YES' : 'NO'}<br>`
    
    if (error || !profile) {
        profileUsername.textContent = 'User not found'
        return
    }
    
    profileUsername.textContent = profile.username || 'Anonymous'
    profileBio.textContent = profile.bio || 'No bio yet.'
    postsByUser.textContent = profile.username || 'this user'
    
    if (currentUser && currentUser.id === profileId) {
        editProfileBtn.classList.remove('hidden')
        debugBox.innerHTML += `Button should be visible now<br>`
        editUsername.value = profile.username || ''
        editBio.value = profile.bio || ''
    } else {
        debugBox.innerHTML += `Button hidden: not your profile<br>`
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
            username: editUsername.value, 
            bio: editBio.value 
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
