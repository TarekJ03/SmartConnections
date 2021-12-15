import {JWKInterface, JWKPublicInterface} from "arweave/node/lib/wallet"
import { Dispatch, SetStateAction } from "react"

export type Connections = {
    [origin: string]: {
        [target: string]: {
            [namespace: string]: {
                [connectionType: string]: {
                    createdAt: number,
                    alias: string | null
                }
            }
        }
    }
}

export type FollowConnection = {
    connectionType: string,
    origin: string,
    target: string,
    namespace: string,
    createdAt: number,
    alias: string | null
}

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