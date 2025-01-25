import netlifyIdentity from 'netlify-identity-widget'

export const initAuth = () => {
  netlifyIdentity.init({
    APIUrl: process.env.NETLIFY_IDENTITY_URL
  })
}

export const getCurrentUser = () => {
  return netlifyIdentity.currentUser()
}

export const login = () => netlifyIdentity.open('login')
export const logout = () => netlifyIdentity.logout() 