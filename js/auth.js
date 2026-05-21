import { supabase } from './supabase.js'

const email = document.getElementById('email')
const password = document.getElementById('password')
const submitBtn = document.getElementById('submitBtn')
const toggleBtn = document.getElementById('toggleBtn')
const title = document.getElementById('title')
const msg = document.getElementById('msg')

let isLogin = true

// Check if already logged in
const { data: { session } } = await supabase.auth.getSession()
if (session) {
    window.location.href = './index.html'
}

// Toggle between Login / Signup
toggleBtn.onclick = () => {
    isLogin = !isLogin
    title.textContent = isLogin ? 'Login to CEM Hub' : 'Sign Up for CEM Hub'
    submitBtn.textContent = isLogin ? 'Login' : 'Sign Up'
    toggleBtn.textContent = isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'
    msg.textContent = ''
}

// Handle submit
submitBtn.onclick = async () => {
    msg.style.color = 'red'
    msg.textContent = 'Loading...'
    
    if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value
        })
        if (error) {
            msg.textContent = error.message
        } else {
            window.location.href = './index.html'
        }
    } else {
        const { error } = await supabase.auth.signUp({
            email: email.value,
            password: password.value
        })
        if (error) {
            msg.textContent = error.message
        } else {
            msg.style.color = 'green'
            msg.textContent = 'Check your email to confirm your account!'
        }
    }
}
