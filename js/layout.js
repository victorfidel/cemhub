// layout.js
import { supabase } from './supabase.js'

export async function initLayout() {
    // Inject header if it doesn't exist
    if (!document.getElementById('siteHeader')) {
        document.body.insertAdjacentHTML('afterbegin', `
            <header id="siteHeader">
                <nav>
                    <div class="nav-left">
                        <button id="hamburgerBtn" class="hamburger">☰</button>
                        <a href="./index.html" class="logo">CEM Hub</a>
                        <div id="navMenu" class="nav-menu hidden">
                            <a href="./index.html">Homepage</a>
                            <a href="./blog.html">Blog</a>
                            <a href="./founder.html">Founder</a>
                            <a href="./donation.html">Donation</a>
                            <a href="./hall-of-fame.html">Hall of Fame</a>
                            <a href="./contact.html">Contact</a>
                        </div>
                    </div>
                    <div class="nav-right">
                        <span id="userEmail"></span>
                        <button id="notifBtn" class="hidden">🔔 <span id="notifCount" class="hidden"></span></button>
                        <div id="notifDropdown" class="hidden"></div>
                        <button id="loginBtn" class="hidden">Login</button>
                        <button id="logoutBtn" class="hidden">Logout</button>
                    </div>
                </nav>
            </header>
        `)
    }

    // Inject footer if it doesn't exist
    if (!document.getElementById('siteFooter')) {
        document.body.insertAdjacentHTML('beforeend', `
            <footer id="siteFooter">
                <p>© 2026 CEM Hub. All rights reserved.</p>
            </footer>
        `)
    }

    // Now run all the auth + notification logic
    const userEmail = document.getElementById('userEmail')
    const loginBtn = document.getElementById('loginBtn')
    const logoutBtn = document.getElementById('logoutBtn')
    const notifBtn = document.getElementById('notifBtn')
    const notifCount = document.getElementById('notifCount')
    const notifDropdown = document.getElementById('notifDropdown')
    const hamburgerBtn = document.getElementById('hamburgerBtn')
    const navMenu = document.getElementById('navMenu')

    let notifChannel = null
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user || null

    if (notifChannel) supabase.removeChannel(notifChannel)

    // Hamburger toggle logic
    hamburgerBtn.onclick = (e) => {
        e.stopPropagation()
        navMenu.classList.toggle('hidden')
        notifDropdown.classList.add('hidden')
    }
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && e.target !== hamburgerBtn) {
            navMenu.classList.add('hidden')
        }
        // Fixed: check if click is inside notifBtn or its children
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.add('hidden')
        }
    })

    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
        notifBtn.classList.remove('hidden')
        
        console.log('Current user ID:', currentUser.id) // Debug
        await loadNotifications()

        notifChannel = supabase.channel(`notifications:${currentUser.id}`)
         .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
          }, (payload) => {
              console.log('New notification:', payload)
              loadNotifications()
          })
         .subscribe()

        notifBtn.onclick = (e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('Bell clicked, toggling dropdown') // Debug
            notifDropdown.classList.toggle('hidden')
            navMenu.classList.add('hidden')
        }

    } else {
        userEmail.textContent = ''
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
        notifBtn.classList.add('hidden')
    }

    loginBtn.onclick = () => window.location.href = './login.html'
    logoutBtn.onclick = async () => {
        await supabase.auth.signOut()
        location.reload()
    }

    async function loadNotifications() {
        if (!currentUser) return
        
        const { data: notifs, error } = await supabase
           .from('notifications')
           .select('*')
           .eq('user_id', currentUser.id)
           .order('created_at', { ascending: false })
           .limit(10)
        
        if (error) {
            console.error('Notification error:', error)
            return
        }
        
        console.log('Loaded notifications for', currentUser.email, ':', notifs)
        
        const unread = notifs.filter(n => !n.is_read).length
        notifCount.textContent = unread
        
        if (unread > 0) {
            notifCount.classList.remove('hidden')
            notifCount.style.display = 'inline-block'
        } else {
            notifCount.classList.add('hidden')
            notifCount.style.display = 'none'
        }
        
        notifDropdown.innerHTML = notifs.length ? notifs.map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-article="${n.article_id || ''}">
                <span class="notif-dot ${n.is_read ? 'read' : ''}"></span>
                <div class="notif-content">
                    <div class="notif-message">${n.message}</div>
                    <small>${new Date(n.created_at).toLocaleString()}</small>
                </div>
            </div>
        `).join('') : '<div class="notif-item">No notifications</div>'
        
        document.querySelectorAll('.notif-item[data-id]').forEach(item => {
            item.onclick = async (e) => {
                e.stopPropagation()
                const id = item.dataset.id
                const articleId = item.dataset.article
                await supabase.from('notifications').update({ is_read: true }).eq('id', id)
                notifDropdown.classList.add('hidden')
                if (articleId && articleId !== 'null' && articleId !== '') {
                    window.location.href = `./article.html?id=${articleId}`
                } else {
                    await loadNotifications()
                }
            }
        })
    }

    return currentUser
}
