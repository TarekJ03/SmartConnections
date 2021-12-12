import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react'
import Arweave from "arweave"
import Cookies from 'typescript-cookie/dist/src/compat'
import {loginContext, loginState} from "../providers/loginProvider"
import { arweaveContext } from '../providers/arweaveProvider'
import "../styles/Home.module.css"

const initialValue: loginState = {
  isLoggedIn: false,
  address: undefined,
  jwk: undefined,
}

export default function MyApp({ Component, pageProps }: AppProps) {
  let state: loginState
  try {
    const cookie = Cookies.get("smartconnections-login")
    state = JSON.parse(cookie as string)
  } catch (error) {
    state = initialValue
  }
  console.log(state)
  const [loginState, setLoginState] = useState(state)
  return <arweaveContext.Provider value = {{arweave: Arweave.init({})}}>
      <loginContext.Provider value = {{loginState: loginState, setLoginState: setLoginState}}>
        <Component {...pageProps} />
      </loginContext.Provider>
    </arweaveContext.Provider>
}
