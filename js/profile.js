import { supabase } from './supabase.js'

const params = new URLSearchParams(window.location.search)
const profileId = params.get('id')
const msg = document.getElementById('msg')
const profileContent = document.getElementById('profileContent')
const editBtn = document.getElementById('editBtn')

let currentUser = null
let profileUser = null
let isFollowing = false

init()

supabase.auth.onAuthStateChange(() => init())

async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    if (!profileId) {
        profileContent.innerHTML = '<p>No user specified</p>'
        return
    }
    
    await loadProfile()
}

async function loadProfile() {
    profileContent.innerHTML = 'Loading...'
    
    const { data: profile, error } = await supabase
     .from('profiles')
     .select('id, username, bio, avatar_url')
     .eq('id', profileId)
     .single()
    
    if (error ||!profile) {
        profileContent.innerHTML = '<p>User not found</p>'
        return
    }
    
    profileUser = profile
    
    // Get follower/following counts - don't crash if table missing
    let followerCount = 0
    let followingCount = 0
    
    try {
        const { count: fCount } = await supabase
         .from('follows')
         .select('*', { count: 'exact', head: true })
         .eq('following_id', profileId)
        followerCount = fCount || 0
        
        const { count: fIngCount } = await supabase
         .from('follows')
         .select('*', { count: 'exact', head: true })
         .eq('follower_id', profileId)
        followingCount = fIngCount || 0
        
        // Check if current user follows this profile
        if (currentUser && currentUser.id!== profileId) {
            const { data: follow } = await supabase
             .from('follows')
             .select('follower_id')
             .eq('follower_id', currentUser.id)
             .eq('following_id', profileId)
             .single()
            isFollowing =!!follow
        }
    } catch (e) {
        console.log('Follows table not ready yet:', e.message)
    }
    
    const isOwner = currentUser && currentUser.id === profileId
    const avatarImg = profile.avatar_url 
     ? `<img src="${profile.avatar_url}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;">`
        : `<div style="width:100px;height:100px;border-radius:50%;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:40px;">👤</div>`
    
    profileContent.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            ${avatarImg}
        </div>
        <div id="viewMode">
            <h2>${profile.username || 'Anonymous'}</h2>
            <div style="display:flex;gap:20px;justify-content:center;margin:15px 0;">
                <div><strong>${followerCount}</strong> Followers</div>
                <div><strong>${followingCount}</strong> Following</div>
            </div>
            <p style="white-space:pre-wrap;">${profile.bio || 'No bio yet'}</p>
            ${currentUser &&!isOwner? `
                <button id="followBtn" style="margin-top:15px;padding:8px 16px;">
                    ${isFollowing? 'Unfollow' : 'Follow'}
                </button>
            ` : ''}
        </div>
        <div id="editMode" class="hidden">
            <input type="file" id="avatarInput" accept="image/*" style="margin-bottom:10px;">
            <input type="text" id="usernameInput" value="${profile.username || ''}" placeholder="Username" style="width:100%;padding:8px;margin-bottom:10px;">
            <textarea id="bioInput" placeholder="Bio" style="width:100%;height:100px;padding:8px;">${profile.bio || ''}</textarea>
            <div style="margin-top:10px;">
                <button id="saveBtn">Save</button>
                <button id="cancelBtn">Cancel</button>
            </div>
        </div>
    `
    
    if (isOwner) {
        editBtn.classList.remove('hidden')
        editBtn.onclick = () => toggleEdit(true)
        document.getElementById('saveBtn').onclick = saveProfile
        document.getElementById('cancelBtn').onclick = () => toggleEdit(false)
    } else {
        editBtn.classList.add('hidden')
        const followBtn = document.getElementById('followBtn')
        if (followBtn) followBtn.onclick = toggleFollow
    }
}

async function toggleFollow() {
    if (!currentUser) return
    
    const btn = document.getElementById('followBtn')
    btn.disabled = true
    msg.textContent = isFollowing? 'Unfollowing...' : 'Following...'
    
    if (isFollowing) {
        const { error } = await supabase
         .from('follows')
         .delete()
         .eq('follower_id', currentUser.id)
         .eq('following_id', profileId)
        
        if (error) {
            msg.style.color = 'red'
            msg.textContent = error.message
            btn.disabled = false
        } else {
            isFollowing = false
            msg.style.color = 'green'
            msg.textContent = 'Unfollowed'
            setTimeout(() => {
                msg.textContent = ''
                loadProfile()
            }, 500)
        }
    } else {
        const { error } = await supabase
         .from('follows')
         .insert({ follower_id: currentUser.id, following_id: profileId })
        
        if (error) {
            msg.style.color = 'red'
            msg.textContent = error.message
            btn.disabled = false
        } else {
            isFollowing = true
            msg.style.color = 'green'
            msg.textContent = 'Following!'
            setTimeout(() => {
                msg.textContent = ''
                loadProfile()
            }, 500)
        }
    }
}

function toggleEdit(editing) {
    document.getElementById('viewMode').classList.toggle('hidden', editing)
    document.getElementById('editMode').classList.toggle('hidden',!editing)
    editBtn.classList.toggle('hidden', editing)
}

async function saveProfile() {
    const username = document.getElementById('usernameInput').value.trim()
    const bio = document.getElementById('bioInput').value.trim()
    const avatarFile = document.getElementById('avatarInput').files[0]
    
    if (!username) {
        msg.style.color = 'red'
        msg.textContent = 'Username required'
        return
    }
    
    msg.textContent = 'Saving...'
    let avatar_url = profileUser.avatar_url
    
    if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${currentUser.id}/avatar.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
         .from('avatars')
         .upload(filePath, avatarFile, { upsert: true })
        
        if (uploadError) {
            msg.style.color = 'red'
            msg.textContent = uploadError.message
            return
        }
        
        const { data } = supabase.storage
         .from('avatars')
         .getPublicUrl(filePath)
        
        avatar_url = data.publicUrl
    }
    
    const { error } = await supabase
     .from('profiles')
     .update({ username, bio, avatar_url })
     .eq('id', currentUser.id)
    
    if (error) {
        msg.style.color = 'red'
        msg.textContent = error.message
    } else {
        msg.style.color = 'green'
        msg.textContent = 'Saved!'
        setTimeout(() => {
            msg.textContent = ''
            toggleEdit(false)
            loadProfile()
        }, 1000)
    }
}
