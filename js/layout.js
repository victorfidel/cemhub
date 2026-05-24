// layout.js
import { supabase } from './supabase.js'

export async function initLayout() {
    // Inject header if it doesn't exist
    if (!document.getElementById('siteHeader')) {
        document.body.insertAdjacentHTML('afterbegin', `
            <header id="siteHeader">
                <nav>
                    <div class="nav-left">
                        <button id="hamburgerBtn" class="hamburger">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <a href="./index.html" class="logo">CEM Hub</a>
                        <div id="navMenu" class="nav-menu">
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
            <div id="menuOverlay" class="menu-overlay"></div>
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
    const menuOverlay = document.getElementById('menuOverlay')

    let notifChannel = null
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user || null

    if (notifChannel) supabase.removeChannel(notifChannel)

    function toggleMenu() {
        hamburgerBtn.classList.toggle('active')
        navMenu.classList.toggle('active')
        menuOverlay.classList.toggle('active')
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : ''
    }

    function closeMenu() {
        hamburgerBtn.classList.remove('active')
        navMenu.classList.remove('active')
        menuOverlay.classList.remove('active')
        document.body.style.overflow = ''
    }

    hamburgerBtn.onclick = (e) => {
        e.stopPropagation()
        toggleMenu()
        notifDropdown.classList.add('hidden')
    }
    
    menuOverlay.onclick = closeMenu
    
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            e.target !== hamburgerBtn && 
            !hamburgerBtn.contains(e.target)) {
            closeMenu()
        }
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.add('hidden')
        }
    })

    // Close menu when clicking a nav link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu)
    })

    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
        notifBtn.classList.remove('hidden')
        
        await loadNotifications()

        notifChannel = supabase.channel(`notifications:${currentUser.id}`)
         .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
          }, () => loadNotifications())
         .subscribe()

        notifBtn.onclick = (e) => {
            e.stopPropagation()
            e.preventDefault()
            notifDropdown.classList.toggle('hidden')
            closeMenu()
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
        
        const unread = notifs.filter(n => !n.is_read).length
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
