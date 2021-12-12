import { createContext, SetStateAction, Dispatch, useState } from "react"
import {JWKInterface, JWKPublicInterface} from "arweave/node/lib/wallet"

export type loginState = {
    isLoggedIn: boolean,
    address?: string,
    jwk?: JWKPublicInterface | JWKInterface
}

export type setLoginState = Dispatch<SetStateAction<loginState>>

export type loginContextState = {
    loginState: loginState,
    setLoginState: setLoginState
}

const defaultValue: loginContextState = {
    loginState: {
        isLoggedIn: false,
    },
    setLoginState(){}
}

export const loginContext = createContext<loginContextState>(defaultValue)
