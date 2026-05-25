import { supabase } from './supabase.js'

const body = document.body
const email = document.getElementById('email')
const password = document.getElementById('password')
const fullName = document.getElementById('fullName')
const nationality = document.getElementById('nationality')
const state = document.getElementById('state')
const dob = document.getElementById('dob')
const submitBtn = document.getElementById('submitBtn')
const toggleBtn = document.getElementById('toggleBtn')
const title = document.getElementById('title')
const msg = document.getElementById('msg')
const authForm = document.getElementById('authForm')

let isLogin = true

// Check if already logged in
const { data: { session } } = await supabase.auth.getSession()
if (session) {
    window.location.href = './index.html'
}

// Toggle between Login / Signup
toggleBtn.onclick = () => {
    isLogin = !isLogin
    body.classList.toggle('signup-mode', !isLogin)
    title.textContent = isLogin ? 'Login' : 'Sign Up'
    submitBtn.textContent = isLogin ? 'Login' : 'Sign Up'
    toggleBtn.textContent = isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'
    msg.textContent = ''
    msg.className = ''
    
    document.querySelectorAll('.signup-only input').forEach(input => {
        input.required = !isLogin
    })
}

// Handle submit
authForm.onsubmit = async (e) => {
    e.preventDefault()
    msg.className = ''
    msg.textContent = 'Loading...'
    submitBtn.disabled = true
    
    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.value,
                password: password.value
            })
            if (error) throw error
            window.location.href = './index.html'
            
        } else {
            if (!fullName.value || !nationality.value || !state.value || !dob.value) {
                throw new Error('Please fill in all fields')
            }

            const { data, error } = await supabase.auth.signUp({
                email: email.value,
                password: password.value,
                options: {
                    data: {
                        full_name: fullName.value,
                        nationality: nationality.value,
                        state_of_residence: state.value,
                        date_of_birth: dob.value
                    }
                }
            })
            if (error) throw error
            
            msg.className = 'success'
            msg.textContent = 'Check your email to confirm your account!'
            authForm.reset()
        }
    } catch (error) {
        msg.className = 'error'
        msg.textContent = error.message
    } finally {
        submitBtn.disabled = false
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        window.location.href = './index.html'
    }
})
