import { supabase } from './supabase.js'

const params = new URLSearchParams(window.location.search)
const profileId = params.get('id')
const msg = document.getElementById('msg')
const profileContent = document.getElementById('profileContent')
const editBtn = document.getElementById('editBtn')

let currentUser = null
let profileUser = null

init()

supabase.auth.onAuthStateChange(() => init())

async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    if (!profileId) {
        profileContent.innerHTML = '<p>No user specified. Add ?id=YOUR_USER_ID to the URL</p>'
        return
    }
    
    await loadProfile()
}

async function loadProfile() {
    profileContent.innerHTML = 'Loading profile...'
    
    const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url')
    .eq('id', profileId)
    .single()
    
    if (error) {
        profileContent.innerHTML = `<p>Error loading profile: ${error.message}</p>`
        return
    }
    
    if (!profile) {
        profileContent.innerHTML = '<p>User not found</p>'
        return
    }
    
    profileUser = profile
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
            <p style="white-space:pre-wrap;">${profile.bio || 'No bio yet'}</p>
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
    }
}

function toggleEdit(editing) {
    document.getElementById('viewMode').classList.toggle('hidden', editing)
    document.getElementById('editMode').classList.toggle('hidden', !editing)
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
