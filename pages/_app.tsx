import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Arweave from "arweave"
import React, { useState, createContext } from 'react'
import Cookies from 'typescript-cookie/dist/src/compat'
import { loginState, loginContextState } from '../types/types'
import "../styles/Home.module.css"

export const contractID = "8zsrYKY_ZD9MJZcYjjpq4rajA2WGPAWrrq6IdfL4GnM"

const initialValue: loginState = {
  isLoggedIn: false,
  address: undefined,
  jwk: undefined,
}

let loginContext: React.Context<loginContextState>

export default function MyApp({ Component, pageProps }: AppProps) {
  let state: loginState
  try {
    const cookie = Cookies.get("smartconnections-login")
    state = JSON.parse(cookie as string)
  } catch (error) {
    state = initialValue
  }
  const [loginState, setLoginState] = useState(state)
  const loginContextState: loginContextState = {
    loginState,
    setLoginState
  }
  loginContext = createContext<loginContextState>(loginContextState)
  return <loginContext.Provider value = {{loginState: loginState, setLoginState: setLoginState}}>
        <Component {...pageProps} />
  </loginContext.Provider>
}

export {loginContext}
export const arweave = Arweave.init({})