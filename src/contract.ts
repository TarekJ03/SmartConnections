// Declares the state's type
type State = {
    owners: string[],
    namespaces: {
        [namespace: string]: string[]
    },
    connections: {
        [address: string]: {
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
}

// Action can be either a follow, an unfollow, a followers lookup or followings lookup call
type Action = FollowAction | UnfollowAction | FollowingsAction | FollowersAction | NamespaceAction | ConnectionTypesAction

// Declares the follow action's type
type FollowAction = {
    caller: string,
    input: {
        function: "follow",
        target: string,
        namespace: string,
        connectionType: string,
        alias?: string
    }
}

// Declares the unfollow action's type
type UnfollowAction = {
    caller: string,
    input: {
        function: "unfollow",
        target?: string,
        namespace?: string,
        connectionType?: string,
    }
}

// Declares the followings action's type
type FollowingsAction = {
    caller: string,
    input: {
        function: "followings",
        target?: string
        namespace?: string
    }
}

// Declares the followers action's type
type FollowersAction = {
    caller: string,
    input: {
        function: "followers",
        target?: string
        namespace?: string
    }
}

// Declares the namespace update action's tyoe
type NamespaceAction = {
    caller: string,
    input: {
        function: "addNamespaces",
        namespaces: {
            [namespace: string]: string[]
        }
    }
}

// Declares the connectionTypes update action's type
type ConnectionTypesAction = {
    caller: string,
    input: {
        function: "addConnectionTypes",
        namespace: string,
        connectionTypes: string[]
    }
}

// Declares the `return` parameter type for an address' followings
type FollowingConnection = {
    connectionType: string,
    target: string,
    namespace: string,
    createdAt: Number,
    alias: string | null
}

// Declares the `return` parameter type for an address' followers
type FollowerConnection = {
    connectionType: string,
    origin: string,
    namespace: string,
    createdAt: Number,
    alias: string | null
}

async function handle(state: State, action: Action) {
    const input = action.input

    // Utility to check if two string[] have the same content
    function arrayIsEqual(arr1: string[], arr2: string[]){
        return arr1.length == arr2.length && arr1.every((element, index) => element == arr2[index])
    }

    // Utility to check if an object has no keys
    function objectIsEmpty(obj: object){
        return Object.keys(obj).length == 0
    }

    // Guard to check if the passed action is valid
    function isValidAction(action: any): action is Action{
        return isValidUnfollow(action) || isValidFollow(action) || isValidFollowings(action) || isValidFollowers(action) || isValidNamespaces(action) || isValidConnectionTypes(action)
    }

    // Guard to check if the passed action is a valid follow call
    function isValidFollow(action: Action): action is FollowAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType", "alias"])){
            if (input.function == "follow"){
                if (typeof input.target == "string" && typeof input.namespace == "string" && typeof input.connectionType == "string"){
                    if (input.target == action.caller){
                        /* @ts-ignore */
                        throw new ContractError("Can't follow own address")
                    } if (input.alias && !(typeof input.alias == "string")){
                        /* @ts-ignore */
                        throw new ContractError(`Alias ${alias} was passed but is not a string`)
                    } if (!(Object.keys(state.namespaces).includes(input.namespace))){
                        /* @ts-ignore */
                        throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                    } if (!(state.namespaces[input.namespace].includes(input.connectionType))){
                        /* @ts-ignore */
                        throw new ContractError(`Connection type ${input.connectionType} is not a valid connection type for the namespace ${input.namespace}`)
                    }
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid unfollow call
    function isValidUnfollow(action: Action): action is UnfollowAction{
        if (arrayIsEqual(Object.keys(input), ["function", "target"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace", "connectionType"])){
            if (input.function == "unfollow"){
                if (input.target){
                    if (!(typeof input.target == "string")){
                        /* @ts-ignore */
                        throw new ContractError(`${input.target} is not a string`)
                    } if (!(Object.keys(state.connections[action.caller]).includes(input.target))){
                        /* @ts-ignore */ 
                        throw new ContractError(`${action.caller} is not connected to ${input.target}`)
                    } if (input.namespace){
                        if (!(typeof input.namespace == "string")){
                            /* @ts-ignore */
                            throw new ContractError(`${input.namespace} is not a string`)
                        } if (!(Object.keys(state.namespaces).includes(input.namespace))){
                            /* @ts-ignore */
                            throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                        } if (!(Object.keys(state.connections[action.caller][input.target]).includes(input.namespace))){
                            /* @ts-ignore */ 
                            throw new ContractError(`${action.caller} is not connected to ${input.target} on ${input.namespace}`)
                        } if (input.connectionType){
                            if (!(typeof input.connectionType == "string")){
                                /* @ts-ignore */
                                throw new ContractError(`${input.connectionType} is not a string`)
                            } if (!(state.namespaces[input.namespace].includes(input.connectionType))){
                                /* @ts-ignore */
                                throw new ContractError(`${input.connectionType} is not a valid connection type for the namespace ${input.namespace}`)
                            } if (!(Object.keys(state.connections[action.caller][input.target][input.namespace]).includes(input.connectionType))){
                                /* @ts-ignore */ 
                                throw new ContractError(`${action.caller} is not connected to ${input.target} on ${input.namespace} with the connection type ${input.connectionType}`)
                            }
                        }
                    }
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid followings call
    function isValidFollowings(action: Action): action is FollowingsAction{
        if (arrayIsEqual(Object.keys(input), ["function"]) || arrayIsEqual(Object.keys(input), ["function", "target"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace"])){
            if (input.function == "followings"){
                if (input.target){
                    if (typeof input.target != "string"){
                        /* @ts-ignore */
                        throw new ContractError(`${input.target} is not a string`)
                    } if (input.namespace){
                        if (typeof input.namespace != "string"){
                            /* @ts-ignore */
                            throw new ContractError(`${input.namespace} is not a string`)
                        } if (!(Object.keys(state.namespaces).includes(input.namespace))){
                            /* @ts-ignore */
                            throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                        }
                    }
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid followers call
    function isValidFollowers(action: Action): action is FollowersAction{
        if (arrayIsEqual(Object.keys(input), ["function"]) || arrayIsEqual(Object.keys(input), ["function", "target"]) || arrayIsEqual(Object.keys(input), ["function", "target", "namespace"])){
            if (input.function == "followers"){
                if (input.target){
                    if (typeof input.target != "string"){
                        /* @ts-ignore */
                        throw new ContractError(`${input.target} is not a string`)
                    } if (input.namespace){
                        if (typeof input.namespace != "string"){
                            /* @ts-ignore */
                            throw new ContractError(`${input.namespace} is not a string`)
                        } if (!(Object.keys(state.namespaces).includes(input.namespace))){
                            /* @ts-ignore */
                            throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                        }
                    }
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid call to update the namespaces
    function isValidNamespaces(action: Action): action is NamespaceAction{
        if (arrayIsEqual(Object.keys(input), ["function", "namespaces"])){
            if (!(state.owners.includes(action.caller))){
                /* @ts-ignore */
                throw new ContractError("The calling address is not allowed to change this contract's configuration")
            } if (input.function == "addNamespaces"){
                if (!(typeof input.namespaces == "object") || !(Object.keys(input.namespaces).every(namespace => typeof namespace == "string" && Array.isArray(input.namespaces[namespace]) && input.namespaces[namespace].every(connectionType => typeof connectionType == "string")))){
                  /* @ts-ignore */
                    throw new ContractError(`${input.namespaces} are not exclusively string: string[] pairs`)
                } if (Object.keys(input.namespaces).every(element => Object.keys(state.namespaces).includes(element))){
                    /* @ts-ignore */
                    throw new ContractError(`Namespaces ${input.namespaces} are all already present in the current namespaces: ${Object.keys(state.namespaces)}`)
                } return true
            }
        } return false
    }

    // Guard to check if the passed action is a valid call to update the connection types
    function isValidConnectionTypes(action: Action): action is ConnectionTypesAction{
        if (arrayIsEqual(Object.keys(input), ["function", "namespace", "connectionTypes"])){
            if (!(state.owners.includes(action.caller))){
                /* @ts-ignore */
                throw new ContractError("The calling address is not allowed to change this contract's configuration")
            } if (input.function == "addConnectionTypes"){
                if (!(Object.keys(state.namespaces).includes(input.namespace))){
                    /* @ts-ignore */
                    throw new ContractError(`Namespace ${input.namespace} is not a valid namespace`)
                } if (!Array.isArray(input.connectionTypes)) {
                    /* @ts-ignore */
                    throw new ContractError(`${input.connectionTypes} is not an array`)
                } if (!(input.connectionTypes.every(element => typeof element == "string"))){
                    /* @ts-ignore */
                    throw new ContractError(`Connection types ${input.connectionTypes} are not exclusively strings`)
                } if (input.connectionTypes.every(element => state.namespaces[input.namespace].includes(element))){
                    /* @ts-ignore */
                    throw new ContractError(`Connection types ${input.connectionTypes} are all already present in the current connection types: ${state.connectionTypes}`)
                } return true
            }
        } return false
    }

    // Primitive check to ensure a given target matches the Ethereum address specification
    function isValidEthAdress(target: string): boolean {
        return target.slice(0, 2) == "0x" && target.length == 42
    }

    // Checks if a passed target is a valid address
    async function isValidTarget(target: string): Promise<boolean>{
        /* @ts-ignore */ 
        return Object.keys(state.connections).includes(target) || await SmartWeave.arweave.wallets.getLastTransactionID(target) || isValidEthAdress(target)
    }

    // Check if the passed action is a valid input
    if (isValidAction(action)){
        // If it's a valid follow call, attempt to execute the follow
        if (isValidFollow(action)){
            // Declare all relevant variables
            const caller = action.caller;
            const target = action.input.target;
            const namespace = action.input.namespace;
            const connectionType = action.input.connectionType;
            const alias = typeof action.input.alias == "string" ? action.input.alias : null
            /* @ts-ignore */
            // Ensure the target is a valid address
            if (!(await isValidTarget(target))){
                /* @ts-ignore */ 
                throw new ContractError(`Address ${target} is not a valid address`)
            } // If the target has already been connected to in this namespace and this connection type, but the alias is different, overwrite the connection
            if (state.connections[caller]){
                if (state.connections[caller][target]){
                    if (state.connections[caller][target][namespace]){
                        if (state.connections[caller][target][namespace][connectionType]){
                            if (alias == state.connections[caller][target][namespace][connectionType].alias){
                                /* @ts-ignore */
                                // If the target has already been connected to in this namespace with this connection type and this alias, reject the call 
                                throw new ContractError(`${caller} is already connected to ${target} on ${namespace} with connection type ${connectionType}${alias ? "as" + alias : ""}`)
                                }
                            }
                        state.connections[caller][target][namespace][connectionType] = { 
                            /* @ts-ignore */
                            "createdAt": SmartWeave.block.timestamp,
                            "alias": alias
                            }
                    } else {
                        state.connections[caller][target][namespace] = {
                            [connectionType]: { 
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                                }
                            }
                        }
                } else {
                    state.connections[caller][target] = {
                        [namespace]: {
                            [connectionType]: {
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                            }
                        }
                    }
                }
            } else {
                state.connections[caller] = {
                    [target]: {
                        [namespace]: {
                            [connectionType]: {
                                /* @ts-ignore */
                                "createdAt": SmartWeave.block.timestamp,
                                "alias": alias
                            }
                        }
                    }
                }
            }
            return { state }
        }    
        // If it's a valid disconnect call, execute the disconnect
        if (isValidUnfollow(action)){
            const caller = action.caller;
            const target = action.input.target
            const namespace = action.input.namespace
            const connectionType = action.input.connectionType
            if (target){
                if (namespace){
                    if (connectionType){
                        delete state.connections[caller][target][namespace][connectionType]
                        if (objectIsEmpty(state.connections[caller][target][namespace])){
                            delete state.connections[caller][target][namespace]
                        }
                    } else {
                        delete state.connections[caller][target][namespace]
                    } if (objectIsEmpty(state.connections[caller][target])){
                        delete state.connections[caller][target]        
                    }
                } else {
                    delete state.connections[caller][target]
                } if (objectIsEmpty(state.connections[caller])){
                    delete state.connections[caller]
                }
            } else {
                delete state.connections[caller]
            }
            return { state }
        }
        // If it's a valid followings call, get all followings
        if (isValidFollowings(action)){
            const target = action.input.target
            const targetNamespace = action.input.namespace
            // Return the followings of the target on the namespace (if given) as an object, keyed by the following address
            return { result: Object.fromEntries(Object.keys(state.connections).filter(origin => !(target) || origin == target).map(origin => {
                return [ origin, Object.keys(state.connections[origin]).flatMap(following => {
                    return Object.keys(state.connections[origin][following]).filter(namespace => !(targetNamespace) || namespace == targetNamespace).flatMap(namespace => {
                        return Object.keys(state.connections[origin][following][namespace]).flatMap((connectionType): FollowingConnection => {
                            return {
                            connectionType,
                            target: following,
                            namespace,
                            createdAt: state.connections[origin][following][namespace][connectionType].createdAt,
                            alias: state.connections[origin][following][namespace][connectionType].alias
                            }
                        })
                    })
                }) ]
            })) }
        }
        // If it's a valid followers call, get all followers
        if (isValidFollowers(action)){
            const target = action.input.target
            const targetNamespace = action.input.namespace
            const alreadyDone: string[] = []
            // Return the followers of the target on the namespace (if given) as an object, keyed by the followed address
            return { result: Object.fromEntries(Object.keys(state.connections).flatMap(outerOrigin => {
                return Object.keys(state.connections[outerOrigin]).filter(outerFollowing => !(alreadyDone.includes(outerFollowing)) && (!(target) || outerFollowing == target)).map(outerFollowing => {
                    return [outerFollowing, Object.keys(state.connections).flatMap(origin => {
                        alreadyDone.push(outerFollowing)
                        return Object.keys(state.connections[origin]).filter(following => following == outerFollowing).flatMap(following => {
                            return Object.keys(state.connections[origin][following]).filter(namespace => !(targetNamespace) || namespace == targetNamespace).flatMap(namespace => {
                                return Object.keys(state.connections[origin][following][namespace]).flatMap((connectionType): FollowerConnection => {
                                    return {
                                    connectionType,
                                    origin: origin,
                                    namespace,
                                    createdAt: state.connections[origin][following][namespace][connectionType].createdAt,
                                    alias: state.connections[origin][following][namespace][connectionType].alias
                                    }
                                })
                            })
                        })
                    }) ]
                })
            })) }
        }
        // If it's a valid namespaces update call, update the namespaces
        if (isValidNamespaces(action)){
            Object.keys(action.input.namespaces).forEach(newNamespace => Object.keys(state.namespaces).includes(newNamespace) ? {} : state.namespaces[newNamespace] = action.input.namespaces[newNamespace])
            return { state }
        }
        // If it's a valid connection types update call, update the connection types
        if (isValidConnectionTypes(action)){
            action.input.connectionTypes.forEach(newConnectionType => state.namespaces[action.input.namespace].includes(newConnectionType) ? {} : state.namespaces[action.input.namespace].push(newConnectionType))
            return { state }
        }
    }
    /* @ts-ignore */
    throw new ContractError(`Action ${action} is not valid`)
}