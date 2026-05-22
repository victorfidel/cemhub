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
const userArticles = document.getElementById('userArticles')
const postsByUser = document.getElementById('postsByUser') // You had this, I was missing it

let currentUser = null

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
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
    
    if (!profileId) {
        profileUsername.textContent = 'No user selected'
        profileBio.textContent = 'Click a username on the homepage to view a profile'
        postsByUser.textContent = ''
        userArticles.innerHTML = ''
        return
    }
    
    profileUsername.textContent = 'Loading profile...'
    profileBio.textContent = ''
    
    const { data: profile, error } = await supabase
     .from('profiles')
     .select('username, bio')
     .eq('id', profileId)
     .single()
    
    if (error) {
        profileUsername.textContent = 'Error'
        profileBio.textContent = error.message
        postsByUser.textContent = ''
        userArticles.innerHTML = ''
        return
    }
    
    if (!profile) {
        profileUsername.textContent = 'User not found'
        profileBio.textContent = 'This user does not exist'
        postsByUser.textContent = ''
        return
    }
    
    const displayName = profile.username || 'Anonymous'
    profileUsername.textContent = displayName
    profileBio.textContent = profile.bio || 'No bio yet'
    postsByUser.textContent = displayName // Now this updates too
    
    if (currentUser && currentUser.id === profileId) {
        editProfileBtn.classList.remove('hidden')
        editProfileBtn.onclick = () => {
            editProfileForm.classList.remove('hidden')
            editUsername.value = profile.username || ''
            editBio.value = profile.bio || ''
        }
        saveProfileBtn.onclick = async () => {
            saveProfileBtn.textContent = 'Saving...'
            const { error: updateError } = await supabase.from('profiles').update({
                username: editUsername.value,
                bio: editBio.value
            }).eq('id', currentUser.id)
            
            if (updateError) {
                alert('Error: ' + updateError.message)
                saveProfileBtn.textContent = 'Save'
            } else {
                editProfileForm.classList.add('hidden')
                saveProfileBtn.textContent = 'Save'
                init() // Reload to show new data
            }
        }
        cancelProfileBtn.onclick = () => editProfileForm.classList.add('hidden')
    }
    
    userArticles.innerHTML = 'Loading posts...'
    const { data: articles, error: articlesError } = await supabase
     .from('articles')
     .select('title, content, created_at')
     .eq('author_id', profileId)
     .order('created_at', { ascending: false })
    
    if (articlesError) {
        userArticles.innerHTML = 'Error loading posts: ' + articlesError.message
    } else if (articles && articles.length > 0) {
        userArticles.innerHTML = articles.map(a => `
            <div class="article">
                <h3>${a.title}</h3>
                <p>${a.content.replace(/\n/g, '<br>')}</p>
                <div class="meta">${new Date(a.created_at).toLocaleString()}</div>
            </div>
        `).join('')
    } else {
        userArticles.innerHTML = '<p>No posts yet</p>'
    }
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()import { supabase } from './supabase.js'

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
const userArticles = document.getElementById('userArticles')
const postsByUser = document.getElementById('postsByUser') // You had this, I was missing it

let currentUser = null

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
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
    
    if (!profileId) {
        profileUsername.textContent = 'No user selected'
        profileBio.textContent = 'Click a username on the homepage to view a profile'
        postsByUser.textContent = ''
        userArticles.innerHTML = ''
        return
    }
    
    profileUsername.textContent = 'Loading profile...'
    profileBio.textContent = ''
    
    const { data: profile, error } = await supabase
     .from('profiles')
     .select('username, bio')
     .eq('id', profileId)
     .single()
    
    if (error) {
        profileUsername.textContent = 'Error'
        profileBio.textContent = error.message
        postsByUser.textContent = ''
        userArticles.innerHTML = ''
        return
    }
    
    if (!profile) {
        profileUsername.textContent = 'User not found'
        profileBio.textContent = 'This user does not exist'
        postsByUser.textContent = ''
        return
    }
    
    const displayName = profile.username || 'Anonymous'
    profileUsername.textContent = displayName
    profileBio.textContent = profile.bio || 'No bio yet'
    postsByUser.textContent = displayName // Now this updates too
    
    if (currentUser && currentUser.id === profileId) {
        editProfileBtn.classList.remove('hidden')
        editProfileBtn.onclick = () => {
            editProfileForm.classList.remove('hidden')
            editUsername.value = profile.username || ''
            editBio.value = profile.bio || ''
        }
        saveProfileBtn.onclick = async () => {
            saveProfileBtn.textContent = 'Saving...'
            const { error: updateError } = await supabase.from('profiles').update({
                username: editUsername.value,
                bio: editBio.value
            }).eq('id', currentUser.id)
            
            if (updateError) {
                alert('Error: ' + updateError.message)
                saveProfileBtn.textContent = 'Save'
            } else {
                editProfileForm.classList.add('hidden')
                saveProfileBtn.textContent = 'Save'
                init() // Reload to show new data
            }
        }
        cancelProfileBtn.onclick = () => editProfileForm.classList.add('hidden')
    }
    
    userArticles.innerHTML = 'Loading posts...'
    const { data: articles, error: articlesError } = await supabase
     .from('articles')
     .select('title, content, created_at')
     .eq('author_id', profileId)
     .order('created_at', { ascending: false })
    
    if (articlesError) {
        userArticles.innerHTML = 'Error loading posts: ' + articlesError.message
    } else if (articles && articles.length > 0) {
        userArticles.innerHTML = articles.map(a => `
            <div class="article">
                <h3>${a.title}</h3>
                <p>${a.content.replace(/\n/g, '<br>')}</p>
                <div class="meta">${new Date(a.created_at).toLocaleString()}</div>
            </div>
        `).join('')
    } else {
        userArticles.innerHTML = '<p>No posts yet</p>'
    }
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()
