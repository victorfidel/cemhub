import { supabase } from './supabase.js'

const params = new URLSearchParams(window.location.search)
const profileId = params.get('id')

const userEmail = document.getElementById('userEmail')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const profileUsername = document.getElementById('profileUsername')

console.log('1. Script started')

loginBtn.onclick = () => {
    console.log('Login clicked')
    window.location.href = './login.html'
}

logoutBtn.onclick = async () => {
    console.log('Logout clicked')
    await supabase.auth.signOut()
    console.log('Signed out')
}

async function init() {
    console.log('2. Init running')
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user || null
    console.log('3. Current user:', currentUser?.email)
    
    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
    } else {
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
    
    if (!profileId) {
        profileUsername.textContent = 'Add ?id=YOUR_UUID to URL'
        return
    }
    
    console.log('4. Loading profile:', profileId)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', profileId)
      .single()
    
    console.log('5. Profile result:', profile, error)
    
    if (error) {
        profileUsername.textContent = 'Error: ' + error.message
    } else if (profile) {
        profileUsername.textContent = profile.username || 'Anonymous'
    } else {
        profileUsername.textContent = 'Not found'
    }
}

init()
