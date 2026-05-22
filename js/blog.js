document.addEventListener('DOMContentLoaded', async () => {
    const { supabase } = await import('./supabase.js')
    
    const userEmail = document.getElementById('userEmail')
    const loginBtn = document.getElementById('loginBtn')
    const logoutBtn = document.getElementById('logoutBtn')
    const notifBtn = document.getElementById('notifBtn')
    const notifCount = document.getElementById('notifCount')
    const notifDropdown = document.getElementById('notifDropdown')
    const articleForm = document.getElementById('articleForm')
    const articlesDiv = document.getElementById('articles')
    
    // Check if HTML elements exist
    if (!notifBtn || !notifCount || !notifDropdown) {
        alert('ERROR: Missing notification HTML elements')
        return
    }
    
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user || null
    
    if (!currentUser) {
        alert('Not logged in')
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
        notifBtn.classList.add('hidden')
        loginBtn.onclick = () => window.location.href = './login.html'
        return
    }
    
    alert('Logged in as: ' + currentUser.email) // Should show your email
    
    userEmail.textContent = currentUser.email
    loginBtn.classList.add('hidden')
    logoutBtn.classList.remove('hidden')
    notifBtn.classList.remove('hidden')
    logoutBtn.onclick = async () => await supabase.auth.signOut()
    
    // Load notifications
    const { data: notifs, error } = await supabase
       .from('notifications')
       .select('*')
       .eq('user_id', currentUser.id)
       .order('created_at', { ascending: false })
       .limit(10)
    
    if (error) {
        alert('Query error: ' + error.message)
        return
    }
    
    alert('Found ' + notifs.length + ' notifications for you') // Should say "Found 1"
    
    const unread = notifs.filter(n => !n.is_read).length
    notifCount.textContent = unread > 0 ? unread : ''
    notifCount.style.display = unread > 0 ? 'inline' : 'none'
    
    notifDropdown.innerHTML = notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
            ${n.message}<br>
            <small>${new Date(n.created_at).toLocaleString()}</small>
        </div>
    `).join('') : '<div class="notif-item">No notifications</div>'
    
    notifBtn.onclick = () => {
        notifDropdown.classList.toggle('hidden')
    }
    
    document.querySelectorAll('.notif-item').forEach(item => {
        item.onclick = async () => {
            const id = item.dataset.id
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
            location.reload()
        }
    })
    
    // Rest of your article loading code...
})
