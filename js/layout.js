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
                <div id="debugInfo" style="background:#ff0;padding:6px;font-size:11px;text-align:center;word-break:break-all;"></div>
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

    const userEmail = document.getElementById('userEmail')
    const loginBtn = document.getElementById('loginBtn')
    const logoutBtn = document.getElementById('logoutBtn')
    const notifBtn = document.getElementById('notifBtn')
    const notifCount = document.getElementById('notifCount')
    const notifDropdown = document.getElementById('notifDropdown')
    const hamburgerBtn = document.getElementById('hamburgerBtn')
    const navMenu = document.getElementById('navMenu')
    const debugInfo = document.getElementById('debugInfo')

    let notifChannel = null
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user || null

    if (notifChannel) supabase.removeChannel(notifChannel)

    hamburgerBtn.onclick = (e) => {
        e.stopPropagation()
        navMenu.classList.toggle('hidden')
        notifDropdown.classList.add('hidden')
    }
    
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && e.target !== hamburgerBtn) {
            navMenu.classList.add('hidden')
        }
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.add('hidden')
        }
    })

    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
        notifBtn.classList.remove('hidden')
        
        debugInfo.textContent = `Logged in: ${currentUser.email} | ID: ${currentUser.id}`
        await loadNotifications()

        notifChannel = supabase.channel(`notifications:${currentUser.id}`)
         .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
          }, () => {
              debugInfo.textContent = 'New notification received!'
              loadNotifications()
          })
         .subscribe()

        notifBtn.onclick = (e) => {
            e.stopPropagation()
            e.preventDefault()
            const isHidden = notifDropdown.classList.contains('hidden')
            notifDropdown.classList.toggle('hidden')
            navMenu.classList.add('hidden')
            debugInfo.textContent = isHidden ? 'Dropdown OPENED' : 'Dropdown CLOSED'
        }

    } else {
        userEmail.textContent = ''
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
        notifBtn.classList.add('hidden')
        debugInfo.textContent = 'Not logged in'
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
            debugInfo.textContent = `DB Error: ${error.message}`
            return
        }
        
        const unread = notifs.filter(n => !n.is_read).length
        debugInfo.textContent = `User: ${currentUser.email} | Total: ${notifs.length} | Unread: ${unread}`
        
        notifCount.textContent = unread
        
        if (unread > 0) {
            notifCount.classList.remove('hidden')
            notifCount.style.display = 'inline-block'
            notifCount.style.visibility = 'visible'
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
