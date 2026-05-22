document.addEventListener('DOMContentLoaded', async () => {
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
    const postsByUser = document.getElementById('postsByUser')
    
    if (!profileId) {
        profileUsername.textContent = 'No user selected'
        profileBio.textContent = 'Click a username on the homepage'
        return
    }
    
    try {
        const { supabase } = await import('./supabase.js')
        
        // Handle login/logout header
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null
        
        if (currentUser) {
            userEmail.textContent = currentUser.email
            loginBtn.classList.add('hidden')
            logoutBtn.classList.remove('hidden')
            logoutBtn.onclick = async () => await supabase.auth.signOut()
        } else {
            loginBtn.classList.remove('hidden')
            logoutBtn.classList.add('hidden')
            loginBtn.onclick = () => window.location.href = './login.html'
        }
        
        // Load profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, bio')
            .eq('id', profileId)
            .single()
        
        if (error) throw error
        
        const displayName = profile.username || 'Anonymous'
        profileUsername.textContent = displayName
        profileBio.textContent = profile.bio || 'No bio yet'
        postsByUser.textContent = displayName
        
        // Show edit button only for your own profile
        if (currentUser && currentUser.id === profileId) {
            editProfileBtn.classList.remove('hidden')
            editProfileBtn.onclick = () => {
                editProfileForm.classList.remove('hidden')
                editUsername.value = profile.username || ''
                editBio.value = profile.bio || ''
            }
            cancelProfileBtn.onclick = () => editProfileForm.classList.add('hidden')
            saveProfileBtn.onclick = async () => {
                saveProfileBtn.textContent = 'Saving...'
                const { error: updateError } = await supabase.from('profiles').update({
                    username: editUsername.value,
                    bio: editBio.value
                }).eq('id', currentUser.id)
                
                if (updateError) {
                    alert('Error: ' + updateError.message)
                } else {
                    location.reload() // Easiest way to refresh all data
                }
                saveProfileBtn.textContent = 'Save'
            }
        }
        
        // Load user posts
        userArticles.innerHTML = 'Loading posts...'
        const { data: articles, error: articlesError } = await supabase
            .from('articles')
            .select('title, content, created_at')
            .eq('author_id', profileId)
            .order('created_at', { ascending: false })
        
        if (articlesError) throw articlesError
        
        if (articles.length > 0) {
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
        
    } catch (e) {
        profileUsername.textContent = 'Error'
        profileBio.textContent = e.message
        userArticles.innerHTML = ''
    }
})
