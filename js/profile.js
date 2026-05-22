// This will run no matter what and show errors
document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('profileUsername')
    const bio = document.getElementById('profileBio')
    
    try {
        // Test 1: Did we even get here?
        output.textContent = 'JS is running...'
        
        // Test 2: Check URL
        const params = new URLSearchParams(window.location.search)
        const profileId = params.get('id')
        
        if (!profileId) {
            output.textContent = 'ERROR: No ?id= in URL'
            bio.textContent = 'Current URL: ' + window.location.href
            return
        }
        
        output.textContent = 'Found ID: ' + profileId.substring(0, 8) + '...'
        
        // Test 3: Try loading Supabase
        import('./supabase.js').then(module => {
            const supabase = module.supabase
            output.textContent = 'Supabase loaded. Fetching...'
            
            supabase.from('profiles').select('username,bio').eq('id', profileId).single()
            .then(({data, error}) => {
                if (error) {
                    output.textContent = 'DB Error'
                    bio.textContent = error.message
                } else if (data) {
                    output.textContent = data.username || 'Anonymous'
                    bio.textContent = data.bio || 'No bio'
                    document.getElementById('postsByUser').textContent = data.username || 'Anonymous'
                } else {
                    output.textContent = 'User not found'
                }
            })
            
        }).catch(err => {
            output.textContent = 'Import Failed'
            bio.textContent = err.message + ' | Check if js/supabase.js exists'
        })
        
    } catch (e) {
        output.textContent = 'Crash'
        bio.textContent = e.message
    }
})
