import { supabase } from './supabase.js'

const userEmail = document.getElementById('userEmail')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const postForm = document.getElementById('postForm')
const postBtn = document.getElementById('postBtn')
const title = document.getElementById('title')
const content = document.getElementById('content')
const msg = document.getElementById('msg')
const articlesDiv = document.getElementById('articles')

// Notification elements
const notifBtn = document.getElementById('notifBtn')
const notifCount = document.getElementById('notifCount')
const notifDropdown = document.getElementById('notifDropdown')

let currentUser = null

checkUser()
loadArticles()
createLikeModal()

supabase.auth.onAuthStateChange((event, session) => {
    checkUser()
    loadArticles()
})

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    if (currentUser) {
        userEmail.textContent = currentUser.email
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
        postForm.classList.remove('hidden')
        
        // Notifications
        notifBtn.classList.remove('hidden')
        loadNotifications()
        
        // Real-time notification updates
        supabase.channel('notifications')
         .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
          }, payload => {
              loadNotifications()
          })
         .subscribe()
         
        notifBtn.onclick = () => {
            notifDropdown.classList.toggle('hidden')
        }
        
    } else {
        userEmail.textContent = ''
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
        postForm.classList.add('hidden')
        notifBtn.classList.add('hidden')
    }
}

async function loadNotifications() {
    if (!currentUser) return
    
    const { data: notifs, error } = await supabase
       .from('notifications')
       .select('*')
       .eq('user_id', currentUser.id)
       .order('created_at', { ascending: false })
       .limit(10)
    
    // DEBUG: This will tell us if the query worked
    if (error) {
        alert('Notification error: ' + error.message)
        return
    }
    
    alert('Found ' + notifs.length + ' notifications') // Remove this later
    
    const unread = notifs.filter(n => !n.is_read).length
    notifCount.textContent = unread > 0 ? unread : ''
    notifCount.style.display = unread > 0 ? 'inline' : 'none'
    
    notifDropdown.innerHTML = notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
            ${n.message}<br>
            <small>${new Date(n.created_at).toLocaleString()}</small>
        </div>
    `).join('') : '<div class="notif-item">No notifications</div>'
    
    document.querySelectorAll('.notif-item').forEach(item => {
        item.onclick = async () => {
            const id = item.dataset.id
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
            loadNotifications()
            notifDropdown.classList.add('hidden')
        }
    })
            }

postBtn.onclick = async () => {
    if (!currentUser || !title.value || !content.value) {
        msg.style.color = 'red'
        msg.textContent = 'Title and content required'
        return
    }
    
    msg.textContent = 'Publishing...'
    const { error } = await supabase.from('articles').insert({
        title: title.value,
        content: content.value,
        author_id: currentUser.id
    })
    
    if (error) {
        msg.style.color = 'red'
        msg.textContent = error.message
    } else {
        msg.style.color = 'green'
        msg.textContent = 'Published!'
        title.value = ''
        content.value = ''
        loadArticles()
        setTimeout(() => msg.textContent = '', 2000)
    }
}

function avatarHTML(url, size = 32) {
    if (url) {
        return `<img src="${url}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:8px;">`
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#ddd;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;vertical-align:middle;">👤</div>`
}

async function loadArticles() {
    articlesDiv.innerHTML = 'Loading...'
    
    const { data: articles, error } = await supabase
     .from('articles')
     .select(`
            id, title, content, created_at, author_id,
            profiles ( username, avatar_url ),
            likes(id, user_id, profiles ( username, avatar_url )),
            comments(id, content, created_at, user_id, profiles ( username, avatar_url ))
        `)
     .order('created_at', { ascending: false })
    
    if (error) {
        articlesDiv.innerHTML = `Error: ${error.message}`
        return
    }
    
    if (articles.length === 0) {
        articlesDiv.innerHTML = '<p>No articles yet. Be the first to post!</p>'
        return
    }
    
    articlesDiv.innerHTML = articles.map(article => {
        const likeCount = article.likes.length
        const userLiked = currentUser ? article.likes.some(l => l.user_id === currentUser.id) : false
        const comments = article.comments.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
        const isOwner = currentUser && currentUser.id === article.author_id
        const username = article.profiles?.username || 'Anonymous'
        const avatar = avatarHTML(article.profiles?.avatar_url)
        const authorLink = `<a href="./profile.html?id=${article.author_id}">${avatar}${username}</a>`
        
        return `
        <div class="article" data-id="${article.id}">
            <div class="article-header">
                <h3>${article.title}</h3>
                ${isOwner ? `
                <div class="owner-actions">
                    <button class="editBtn" data-id="${article.id}">Edit</button>
                    <button class="deleteBtn" data-id="${article.id}">Delete</button>
                </div>
                ` : ''}
            </div>
            <div class="article-content" data-id="${article.id}">
                <p>${article.content.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="meta">By ${authorLink} • Posted ${new Date(article.created_at).toLocaleString()}</div>
            
            <div class="actions">
                <button class="likeBtn" data-id="${article.id}" ${!currentUser ? 'disabled' : ''}>
                    ${userLiked ? '❤️' : '🤍'} 
                </button>
                <button class="likeCountBtn" data-id="${article.id}" ${likeCount === 0 ? 'disabled' : ''}>
                    ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}
                </button>
            </div>
            
            <div class="comments">
                <h4>Comments (${comments.length})</h4>
                <div class="comment-list">
                    ${comments.map(c => {
                        const isCommentOwner = currentUser && currentUser.id === c.user_id
                        const commentUsername = c.profiles?.username || 'Anonymous'
                        const commentAvatar = avatarHTML(c.profiles?.avatar_url, 24)
                        const commentUserLink = `<a href="./profile.html?id=${c.user_id}">${commentAvatar}${commentUsername}</a>`
                        return `
                        <div class="comment" data-id="${c.id}">
                            <div class="comment-content" data-id="${c.id}">
                                <p>${c.content}</p>
                            </div>
                            <div class="comment-footer">
                                <span class="meta">${commentUserLink} • ${new Date(c.created_at).toLocaleTimeString()}</span>
                                ${isCommentOwner ? `
                                <div class="owner-actions">
                                    <button class="editCommentBtn" data-id="${c.id}">Edit</button>
                                    <button class="deleteCommentBtn" data-id="${c.id}">Delete</button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        `
                    }).join('')}
                </div>
                ${currentUser ? `
                <div class="comment-form">
                    <input type="text" class="commentInput" placeholder="Add a comment..." data-id="${article.id}">
                    <button class="commentBtn" data-id="${article.id}">Post</button>
                </div>
                ` : '<p>Login to comment</p>'}
            </div>
        `
    }).join('')
    
    document.querySelectorAll('.likeBtn').forEach(btn => {
        btn.onclick = () => toggleLike(btn.dataset.id)
    })
    
    document.querySelectorAll('.likeCountBtn').forEach(btn => {
        btn.onclick = () => showLikes(btn.dataset.id)
    })
    
    document.querySelectorAll('.commentBtn').forEach(btn => {
        btn.onclick = () => postComment(btn.dataset.id)
    })
    
    document.querySelectorAll('.editBtn').forEach(btn => {
        btn.onclick = () => editArticle(btn.dataset.id)
    })
    
    document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.onclick = () => deleteArticle(btn.dataset.id)
    })
    
    document.querySelectorAll('.editCommentBtn').forEach(btn => {
        btn.onclick = () => editComment(btn.dataset.id)
    })
    
    document.querySelectorAll('.deleteCommentBtn').forEach(btn => {
        btn.onclick = () => deleteComment(btn.dataset.id)
    })
}

async function toggleLike(articleId) {
    if (!currentUser) return
    
    const { data: existing } = await supabase
     .from('likes')
     .select('id')
     .eq('article_id', articleId)
     .eq('user_id', currentUser.id)
     .single()
    
    if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id)
    } else {
        await supabase.from('likes').insert({ article_id: articleId, user_id: currentUser.id })
    }
    loadArticles()
}

async function showLikes(articleId) {
    const { data: likes } = await supabase
     .from('likes')
     .select('user_id, profiles ( username, avatar_url )')
     .eq('article_id', articleId)
     .order('created_at', { ascending: false })
    
    const modal = document.getElementById('likeModal')
    const list = document.getElementById('likeList')
    
    if (likes.length === 0) {
        list.innerHTML = '<p>No likes yet</p>'
    } else {
        list.innerHTML = likes.map(l => {
            const username = l.profiles?.username || 'Anonymous'
            const avatar = avatarHTML(l.profiles?.avatar_url, 24)
            return `<div><a href="./profile.html?id=${l.user_id}">${avatar}${username}</a></div>`
        }).join('')
    }
    
    modal.classList.remove('hidden')
}

function createLikeModal() {
    if (document.getElementById('likeModal')) return
    const modal = document.createElement('div')
    modal.id = 'likeModal'
    modal.className = 'hidden'
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Liked by</h3>
                <button id="closeLikeModal">✕</button>
            </div>
            <div id="likeList" class="modal-body"></div>
        </div>
    `
    document.body.appendChild(modal)
    
    document.getElementById('closeLikeModal').onclick = () => {
        modal.classList.add('hidden')
    }
    modal.querySelector('.modal-backdrop').onclick = () => {
        modal.classList.add('hidden')
    }
}

async function postComment(articleId) {
    if (!currentUser) return
    
    const input = document.querySelector(`.commentInput[data-id="${articleId}"]`)
    if (!input.value) return
    
    await supabase.from('comments').insert({
        article_id: articleId,
        user_id: currentUser.id,
        content: input.value
    })
    
    input.value = ''
    loadArticles()
}

function editArticle(articleId) {
    const contentDiv = document.querySelector(`.article-content[data-id="${articleId}"]`)
    const currentContent = contentDiv.querySelector('p').innerText
    const currentTitle = contentDiv.parentElement.querySelector('h3').innerText
    
    contentDiv.innerHTML = `
        <input type="text" class="editTitle" value="${currentTitle}" style="width:100%;margin-bottom:10px;padding:8px;">
        <textarea class="editContent" style="width:100%;height:100px;padding:8px;">${currentContent}</textarea>
        <div style="margin-top:10px;">
            <button class="saveBtn" data-id="${articleId}">Save</button>
            <button class="cancelBtn" data-id="${articleId}">Cancel</button>
        </div>
    `
    
    contentDiv.querySelector('.saveBtn').onclick = async () => {
        const newTitle = contentDiv.querySelector('.editTitle').value
        const newContent = contentDiv.querySelector('.editContent').value
        
        const { error } = await supabase
         .from('articles')
         .update({ title: newTitle, content: newContent })
         .eq('id', articleId)
        
        if (error) alert(error.message)
        else loadArticles()
    }
    
    contentDiv.querySelector('.cancelBtn').onclick = () => loadArticles()
}

async function deleteArticle(articleId) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    
    const { error } = await supabase
     .from('articles')
     .delete()
     .eq('id', articleId)
    
    if (error) alert(error.message)
    else loadArticles()
}

function editComment(commentId) {
    const contentDiv = document.querySelector(`.comment-content[data-id="${commentId}"]`)
    const currentContent = contentDiv.querySelector('p').innerText
    
    contentDiv.innerHTML = `
        <input type="text" class="editCommentInput" value="${currentContent}" style="width:100%;padding:6px;">
        <div style="margin-top:6px;">
            <button class="saveCommentBtn" data-id="${commentId}">Save</button>
            <button class="cancelCommentBtn" data-id="${commentId}">Cancel</button>
        </div>
    `
    
    contentDiv.querySelector('.saveCommentBtn').onclick = async () => {
        const newContent = contentDiv.querySelector('.editCommentInput').value
        
        const { error } = await supabase
         .from('comments')
         .update({ content: newContent })
         .eq('id', commentId)
        
        if (error) alert(error.message)
        else loadArticles()
    }
    
    contentDiv.querySelector('.cancelCommentBtn').onclick = () => loadArticles()
}

async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return
    
    const { error } = await supabase
     .from('comments')
     .delete()
     .eq('id', commentId)
    
    if (error) alert(error.message)
    else loadArticles()
}

loginBtn.onclick = () => window.location.href = './login.html'
logoutBtn.onclick = async () => await supabase.auth.signOut()
                               
