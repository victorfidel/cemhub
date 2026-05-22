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
    
    // Notification elements
    const notifBtn = document.getElementById('notifBtn')
    const notifCount = document.getElementById('notifCount')
    const notifDropdown = document.getElementById('notifDropdown')
    
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
            
            // Notifications
            notifBtn.classList.remove('hidden')
            loadNotifications(supabase, currentUser)
            
            // Real-time notification updates
            supabase.channel('notifications')
             .on('postgres_changes', { 
                  event: 'INSERT', 
                  schema: 'public', 
                  table: 'notifications',
                  filter: `user_id=eq.${currentUser.id}`
              }, payload => {
                  loadNotifications(supabase, currentUser)
              })
             .subscribe()
             
            notifBtn.onclick = () => {
                notifDropdown.classList.toggle('hidden')
            }
            
        } else {
            loginBtn.classList.remove('hidden')
            logoutBtn.classList.add('hidden')
            loginBtn.onclick = () => window.location.href = './login.html'
            notifBtn.classList.add('hidden')
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

async function loadNotifications(supabase, currentUser) {
    if (!currentUser) return
    
    const notifCount = document.getElementById('notifCount')
    const notifDropdown = document.getElementById('notifDropdown')
    
    const { data: notifs } = await supabase
       .from('notifications')
       .select('*')
       .eq('user_id', currentUser.id)
       .order('created_at', { ascending: false })
       .limit(10)
    
    const unread = notifs.filter(n => !n.is_read).length
    notifCount.textContent = unread > 0 ? unread : ''
    notifCount.style.display = unread > 0 ? 'inline' : 'none'
    
    notifDropdown.innerHTML = notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-related="${n.related_id}">
            ${n.message}<br>
            <small>${new Date(n.created_at).toLocaleString()}</small>
        </div>
    `).join('') : '<div class="notif-item">No notifications</div>'
    
    // Mark as read on click
    document.querySelectorAll('.notif-item').forEach(item => {
        item.onclick = async () => {
            const id = item.dataset.id
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
            loadNotifications(supabase, currentUser)
            notifDropdown.classList.add('hidden')
        }
    })
        }
