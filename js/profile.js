import { supabase } from './supabase.js'

const params = new URLSearchParams(window.location.search)
const profileId = params.get('id')

// Show errors on page instead of console
function showError(msg) {
    document.body.innerHTML = `<div style="padding:20px;color:red;font-family:sans-serif"><h2>Error</h2><p>${msg}</p></div>`
}

try {
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
    
    if (!profileUsername) throw new Error('Missing element: profileUsername. Check your profile.html IDs.')
    
    init()
    
    async function init() {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null
        
        if (currentUser) {
            userEmail.textContent = currentUser.email
            loginBtn.classList.add('hidden')
            logoutBtn.classList.remove('hidden')
        } else {
            loginBtn.classList.remove('hidden')
            logoutBtn.classList.add('hidden')
        }
        
        if (!profileId) {
            profileUsername.textContent = 'No user ID in URL'
            profileBio.textContent = 'Add ?id=YOUR_UUID to the URL. Go to homepage and click a username to get the right link.'
            return
        }
        
        profileUsername.textContent = 'Loading...'
        
        const { data: profile, error } = await supabase
         .from('profiles')
         .select('username, bio')
         .eq('id', profileId)
         .single()
        
        if (error) throw new Error('Database error: ' + error.message)
        if (!profile) throw new Error('User not found')
        
        profileUsername.textContent = profile.username || 'Anonymous'
        profileBio.textContent = profile.bio || 'No bio yet'
        
        if (currentUser && currentUser.id === profileId) {
            editProfileBtn.classList.remove('hidden')
            editProfileBtn.onclick = () => {
                editProfileForm.classList.remove('hidden')
                editUsername.value = profile.username || ''
                editBio.value = profile.bio || ''
            }
            saveProfileBtn.onclick = async () => {
                await supabase.from('profiles').update({
                    username: editUsername.value,
                    bio: editBio.value
                }).eq('id', currentUser.id)
                editProfileForm.classList.add('hidden')
                init()
            }
            cancelProfileBtn.onclick = () => editProfileForm.classList.add('hidden')
        }
        
        const { data: articles } = await supabase
         .from('articles')
         .select('title, content, created_at')
         .eq('author_id', profileId)
         .order('created_at', { ascending: false })
        
        userArticles.innerHTML = articles?.length 
         ? articles.map(a => `<div class="article"><h3>${a.title}</h3><p>${a.content}</p></div>`).join('')
            : '<p>No posts yet</p>'
    }
    
    loginBtn.onclick = () => window.location.href = './login.html'
    logoutBtn.onclick = async () => await supabase.auth.signOut()
    
} catch (e) {
    showError(e.message)
}
